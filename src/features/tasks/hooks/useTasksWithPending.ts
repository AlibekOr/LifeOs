import { useMemo } from 'react';
import { useUserPendingEntries } from '../../../hooks/usePendingSync.ts';
import type { DisplayTask } from '../../../types/pendingSync.types.ts';
import { mergePendingTasks } from '../utils/pendingTasks.ts';
import { useAllTasks } from './useTasks.ts';

export function useTasksWithPending() {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useAllTasks();
  const entries = useUserPendingEntries();

  const tasks = useMemo<DisplayTask[] | undefined>(() => {
    const hasTaskEntries = entries.some(entry => entry.entity === 'task');
    if (!data && !hasTaskEntries) {
      return undefined;
    }
    return mergePendingTasks(data, entries);
  }, [data, entries]);

  return { tasks, isLoading, isError, error, refetch, isRefetching };
}
