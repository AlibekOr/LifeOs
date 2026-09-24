import {
  getCurrentTask,
  getNextTask,
  getTaskTimeInfo,
  type TaskTimeInfo,
  type TimedTask,
} from '../../tasks/utils/taskStatus.ts';

export type NowCardView<T> =
  | {
      kind: 'current';
      task: T;
      info: TaskTimeInfo;
      otherInProgressCount: number;
    }
  | { kind: 'next'; task: T; info: TaskTimeInfo }
  | { kind: 'all-done' }
  | { kind: 'hidden' };

// What the Now card shows. Only today's tasks count, plus a task started
// earlier that is still running past midnight.
export function getNowCardView<T extends TimedTask>(
  tasks: readonly T[],
  now: Date,
): NowCardView<T> {
  const today = now.toLocaleDateString('en-CA');
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  const relevant = tasks.filter(
    task =>
      task.due_date === today ||
      (Boolean(task.started_at) &&
        !task.is_completed &&
        getTaskTimeInfo(task, now).end.getTime() >= startOfToday),
  );

  const current = getCurrentTask(relevant, now);
  if (current) {
    return { kind: 'current', ...current };
  }
  const next = getNextTask(relevant, now);
  if (next) {
    return { kind: 'next', ...next };
  }

  const todays = tasks.filter(task => task.due_date === today);
  if (todays.length > 0 && todays.every(task => task.is_completed)) {
    return { kind: 'all-done' };
  }
  return { kind: 'hidden' };
}
