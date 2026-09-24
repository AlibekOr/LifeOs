import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  useToggleTaskCompletion,
  useUpdateTask,
} from '../../tasks/hooks/useTasks.ts';
import type { Task } from '../../../types/task.types.ts';

export const EXTEND_MINUTES = 15;

export type NowCardAction = 'start' | 'complete' | 'extend';

type ActionTask = Pick<Task, 'id' | 'duration_minutes'>;

// The Now card's buttons. Only one action runs at a time, so a double tap can
// never send the same change twice.
export function useNowCardActions() {
  const updateTask = useUpdateTask();
  const toggleCompletion = useToggleTaskCompletion();
  const [pendingAction, setPendingAction] = useState<NowCardAction | null>(
    null,
  );
  // A ref, because state would still be stale on a second tap in the same frame.
  const busy = useRef(false);

  // Resolves to whether the change went through, so callers can react to it.
  const run = async (
    action: NowCardAction,
    request: () => Promise<unknown>,
  ): Promise<boolean> => {
    if (busy.current) {
      return false;
    }
    busy.current = true;
    setPendingAction(action);
    try {
      await request();
      return true;
    } catch (error) {
      console.error(error);
      Alert.alert('Could not update task. Please try again.');
      return false;
    } finally {
      busy.current = false;
      setPendingAction(null);
    }
  };

  return {
    pendingAction,
    start: (task: ActionTask) =>
      run('start', () =>
        updateTask.mutateAsync({
          id: task.id,
          input: { started_at: new Date().toISOString() },
        }),
      ),
    complete: (task: ActionTask) =>
      run('complete', () =>
        toggleCompletion.mutateAsync({ id: task.id, isCompleted: true }),
      ),
    extend: (task: ActionTask) =>
      run('extend', () =>
        updateTask.mutateAsync({
          id: task.id,
          input: { duration_minutes: task.duration_minutes + EXTEND_MINUTES },
        }),
      ),
  };
}
