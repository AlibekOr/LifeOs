import {
  QueryClient,
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { taskService } from '../../../services/task.service.ts';
import { notificationService } from '../../../services/notification.service.ts';
import { requireCurrentUserId } from '../../../services/storage/authStore.ts';
import {
  hasPendingEntry,
  usePendingSyncStore,
} from '../../../store/pendingSync.store.ts';
import { flushPendingEntriesIfOnline } from '../../../hooks/usePendingSync.ts';
import {
  OFFLINE_CAPABLE_MUTATION,
  sendOrQueue,
} from '../../../utils/sendOrQueue.ts';
import { generateUuid } from '../../../utils/uuid.ts';
import type {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from '../../../types/task.types.ts';
import { buildLocalTask, mergePendingTasks } from '../utils/pendingTasks.ts';
import { taskKeys } from './taskKeys.ts';

function findCurrentTask(queryClient: QueryClient, id: string) {
  return mergePendingTasks(
    queryClient.getQueryData<Task[]>(taskKeys.all),
    usePendingSyncStore.getState().entries,
  ).find(task => task.id === id);
}

function createOrQueue(input: CreateTaskInput): Promise<Task> {
  const userId = requireCurrentUserId();
  // Generated up front so a queued retry of this insert stays idempotent.
  const id = generateUuid();

  return sendOrQueue({
    send: () => taskService.createTask(input, id),
    queue: () => {
      usePendingSyncStore
        .getState()
        .enqueueCreate({ entity: 'task', userId, id, payload: input });
      const entry = usePendingSyncStore
        .getState()
        .entries.find(item => item.id === id);
      if (entry?.entity !== 'task' || entry.operation !== 'create') {
        throw new Error('Failed to queue task for sync.');
      }
      return buildLocalTask(entry);
    },
  });
}

function updateOrQueue(
  queryClient: QueryClient,
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const userId = requireCurrentUserId();

  return sendOrQueue({
    send: () => taskService.updateTask(id, input),
    queue: () => {
      const base = findCurrentTask(queryClient, id);
      if (!base) {
        throw new Error('Task not found.');
      }
      usePendingSyncStore
        .getState()
        .enqueueUpdate({ entity: 'task', userId, id, payload: input });
      flushPendingEntriesIfOnline(
        queryClient,
        userId,
        onlineManager.isOnline(),
      );
      return { ...base, ...input };
    },
    // A task with a queued entry may not exist on the server yet, so edits
    // must merge into that entry rather than hit the API out of order.
    forceQueue: hasPendingEntry(id),
  });
}

export function useAllTasks() {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: taskService.getAllTasks,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    ...OFFLINE_CAPABLE_MUTATION,
    mutationFn: (input: CreateTaskInput) => createOrQueue(input),
    onSuccess: savedTask => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      notificationService.scheduleTaskReminder(savedTask);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    ...OFFLINE_CAPABLE_MUTATION,
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      updateOrQueue(queryClient, id, input),
    onSuccess: updatedTask => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      notificationService.scheduleTaskReminder(updatedTask);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: (_data, id) => {
      // Deleting is an explicit user action, so dropping any queued write for
      // this task is intentional, not a silent loss.
      usePendingSyncStore.getState().discardEntry(id);
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      notificationService.cancelTaskReminder(id);
    },
  });
}

export function useToggleTaskCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    ...OFFLINE_CAPABLE_MUTATION,
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      updateOrQueue(queryClient, id, { is_completed: isCompleted }),
    onMutate: async ({ id, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.all,
          previousTasks.map(task =>
            task.id === id ? { ...task, is_completed: isCompleted } : task,
          ),
        );
      }
      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onSuccess: (updatedTask, variables) => {
      if (variables.isCompleted) {
        notificationService.cancelTaskReminder(variables.id);
      } else {
        notificationService.scheduleTaskReminder(updatedTask);
      }
    },
  });
}
