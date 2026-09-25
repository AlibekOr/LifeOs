import { useMemo } from 'react';
import {
  QueryClient,
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { notificationService } from '../../../services/notification.service.ts';
import { planService } from '../../../services/plan.service.ts';
import { requireCurrentUserId } from '../../../services/storage/authStore.ts';
import {
  hasPendingEntry,
  usePendingSyncStore,
} from '../../../store/pendingSync.store.ts';
import {
  flushPendingEntriesIfOnline,
  useUserPendingEntries,
} from '../../../hooks/usePendingSync.ts';
import {
  OFFLINE_CAPABLE_MUTATION,
  sendOrQueue,
} from '../../../utils/sendOrQueue.ts';
import { generateUuid } from '../../../utils/uuid.ts';
import type { DisplayPlan } from '../../../types/pendingSync.types.ts';
import type {
  CreatePlanInput,
  Plan,
  PlanRange,
  PlanStatus,
  UpdatePlanInput,
} from '../../../types/plan.types.ts';
import { buildLocalPlan, mergePendingPlans } from '../utils/pendingPlans.ts';
import { planKeys } from './planKeys.ts';

// A plan can sit in several cached ranges; look through all of them.
function findCurrentPlan(queryClient: QueryClient, id: string) {
  const cached = queryClient
    .getQueriesData<Plan[]>({ queryKey: planKeys.all })
    .flatMap(([, plans]) => plans ?? []);
  return mergePendingPlans(cached, usePendingSyncStore.getState().entries).find(
    plan => plan.id === id,
  );
}

function createOrQueue(input: CreatePlanInput): Promise<Plan> {
  const userId = requireCurrentUserId();
  // Generated up front so a queued retry of this insert stays idempotent.
  const id = generateUuid();

  return sendOrQueue({
    send: () => planService.createPlan(input, id),
    queue: () => {
      usePendingSyncStore
        .getState()
        .enqueueCreate({ entity: 'plan', userId, id, payload: input });
      const entry = usePendingSyncStore
        .getState()
        .entries.find(item => item.id === id);
      if (entry?.entity !== 'plan' || entry.operation !== 'create') {
        throw new Error('Failed to queue plan for sync.');
      }
      return buildLocalPlan(entry);
    },
  });
}

function updateOrQueue(
  queryClient: QueryClient,
  id: string,
  input: UpdatePlanInput,
): Promise<Plan> {
  const userId = requireCurrentUserId();

  return sendOrQueue({
    send: () => planService.updatePlan(id, input),
    queue: () => {
      const base = findCurrentPlan(queryClient, id);
      if (!base) {
        throw new Error('Plan not found.');
      }
      usePendingSyncStore
        .getState()
        .enqueueUpdate({ entity: 'plan', userId, id, payload: input });
      flushPendingEntriesIfOnline(
        queryClient,
        userId,
        onlineManager.isOnline(),
      );
      return { ...base, ...input };
    },
    // A plan with a queued entry may not exist on the server yet, so edits
    // must merge into that entry rather than hit the API out of order.
    forceQueue: hasPendingEntry(id),
  });
}

// Plans overlapping the range, with unsynced local changes on top.
export function usePlans(range: PlanRange) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: planKeys.range(range),
    queryFn: () => planService.getPlans(range),
  });
  const entries = useUserPendingEntries();

  const plans = useMemo<DisplayPlan[] | undefined>(() => {
    const hasPlanEntries = entries.some(entry => entry.entity === 'plan');
    if (!data && !hasPlanEntries) {
      return undefined;
    }
    return mergePendingPlans(data, entries, range);
  }, [data, entries, range]);

  return { plans, isLoading, isError, error, refetch, isRefetching };
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    ...OFFLINE_CAPABLE_MUTATION,
    mutationFn: (input: CreatePlanInput) => createOrQueue(input),
    onSuccess: savedPlan => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      notificationService.schedulePlanReminder(savedPlan);
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    ...OFFLINE_CAPABLE_MUTATION,
    mutationFn: ({ id, input }: { id: string; input: UpdatePlanInput }) =>
      updateOrQueue(queryClient, id, input),
    onSuccess: updatedPlan => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      notificationService.schedulePlanReminder(updatedPlan);
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => planService.deletePlan(id),
    onSuccess: (_data, id) => {
      // Deleting is an explicit user action, so dropping any queued write for
      // this plan is intentional, not a silent loss.
      usePendingSyncStore.getState().discardEntry(id);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      notificationService.cancelPlanReminder(id);
    },
  });
}

export function useSetPlanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    ...OFFLINE_CAPABLE_MUTATION,
    mutationFn: ({ id, status }: { id: string; status: PlanStatus }) =>
      updateOrQueue(queryClient, id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: planKeys.all });
      const previous = queryClient.getQueriesData<Plan[]>({
        queryKey: planKeys.all,
      });
      previous.forEach(([queryKey, plans]) => {
        if (plans) {
          queryClient.setQueryData<Plan[]>(
            queryKey,
            plans.map(plan => (plan.id === id ? { ...plan, status } : plan)),
          );
        }
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([queryKey, plans]) => {
        queryClient.setQueryData(queryKey, plans);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
    // Done and cancelled plans lose their reminder; restoring one brings it back.
    onSuccess: updatedPlan => {
      notificationService.schedulePlanReminder(updatedPlan);
    },
  });
}
