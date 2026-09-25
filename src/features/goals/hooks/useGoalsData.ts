import { useTasksWithPending } from '../../tasks/hooks/useTasksWithPending.ts';
import { useGoalMilestones, useGoals } from './useGoals.ts';

// Everything a goals screen needs: the goals, their milestones and the tasks
// (with unsynced local changes) that progress is counted from.
export function useGoalsData() {
  const goalsQuery = useGoals();
  const milestonesQuery = useGoalMilestones();
  const { tasks } = useTasksWithPending();

  const refetch = () =>
    Promise.all([goalsQuery.refetch(), milestonesQuery.refetch()]);

  return {
    goals: goalsQuery.data,
    milestones: milestonesQuery.data,
    tasks,
    isLoading: goalsQuery.isLoading || milestonesQuery.isLoading,
    isError: goalsQuery.isError || milestonesQuery.isError,
    error: goalsQuery.error ?? milestonesQuery.error,
    isRefetching: goalsQuery.isRefetching || milestonesQuery.isRefetching,
    refetch,
  };
}
