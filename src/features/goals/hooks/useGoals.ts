import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../../../services/goal.service.ts';
import { taskKeys } from '../../tasks/hooks/taskKeys.ts';
import type {
  CreateGoalInput,
  CreateMilestoneInput,
  UpdateGoalInput,
  UpdateMilestoneInput,
} from '../../../types/goal.types.ts';
import { goalKeys } from './goalKeys.ts';

export function useGoals() {
  return useQuery({
    queryKey: goalKeys.all,
    queryFn: goalService.getGoals,
  });
}

export function useGoalMilestones() {
  return useQuery({
    queryKey: goalKeys.milestones,
    queryFn: goalService.getMilestones,
  });
}

// Goals are written online only: the mutations need a connection, and TanStack
// pauses them while offline instead of queueing them across restarts.

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGoalInput) => goalService.createGoal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGoalInput }) =>
      goalService.updateGoal(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

// Completing is a manual action: the app offers it once progress reaches 100%.
export function useSetGoalCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      goalService.updateGoal(id, {
        completed_at: completed ? new Date().toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.milestones });
      // The database unlinks the goal's tasks.
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMilestoneInput) =>
      goalService.createMilestone(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.milestones });
    },
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMilestoneInput }) =>
      goalService.updateMilestone(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.milestones });
    },
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalService.deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.milestones });
      // The database unlinks the milestone's tasks from it.
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
