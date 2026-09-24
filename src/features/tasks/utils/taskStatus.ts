import type { Task } from '../../../types/task.types.ts';

type TaskTiming = Pick<Task, 'is_completed' | 'due_date' | 'scheduled_time'>;

export type TimedTask = TaskTiming &
  Pick<Task, 'duration_minutes' | 'started_at'>;

// upcoming: before the scheduled time.
// awaiting-start: the time has come but the user has not pressed Start yet
//   (only for START_GRACE_MINUTES).
// in-progress: started and the duration has not run out.
// overdue: started, but the duration ran out before it was completed.
// missed: never started and the grace period is over (belongs in the archive).
// done: completed; always wins.
export type TaskTimeStatus =
  | 'upcoming'
  | 'awaiting-start'
  | 'in-progress'
  | 'overdue'
  | 'missed'
  | 'done';

export type TaskTimeInfo = {
  status: TaskTimeStatus;
  // Actual start when the task was started, otherwise the scheduled start.
  start: Date;
  // start + duration.
  end: Date;
  // in-progress: end - now; upcoming: start - now; otherwise 0.
  remainingMs: number;
  // 0..1, only meaningful while in-progress.
  progress: number;
};

export const MIN_TASK_DURATION_MINUTES = 1;
// How long a task that was never started is kept before it counts as missed.
export const START_GRACE_MINUTES = 5;

const MS_PER_MINUTE = 60 * 1000;

// due_date is "YYYY-MM-DD" and scheduled_time "HH:mm[:ss]", both local time.
export function getTaskStart(
  task: Pick<Task, 'due_date' | 'scheduled_time'>,
): Date {
  return new Date(`${task.due_date}T${task.scheduled_time}`);
}

function getStartedAt(task: Pick<Task, 'started_at'>): Date | null {
  if (!task.started_at) {
    return null;
  }
  const startedAt = new Date(task.started_at);
  return Number.isNaN(startedAt.getTime()) ? null : startedAt;
}

// The database only allows durations above 0, but a queued offline write is not
// checked there, so a bad value must not produce an empty or negative window.
function getDurationMs(task: Pick<Task, 'duration_minutes'>): number {
  const minutes = task.duration_minutes;
  return (
    (Number.isFinite(minutes) && minutes >= MIN_TASK_DURATION_MINUTES
      ? minutes
      : MIN_TASK_DURATION_MINUTES) * MS_PER_MINUTE
  );
}

export function getTaskTimeInfo(task: TimedTask, now: Date): TaskTimeInfo {
  const startedAt = getStartedAt(task);
  const start = startedAt ?? getTaskStart(task);
  const durationMs = getDurationMs(task);
  const end = new Date(start.getTime() + durationMs);
  const nowMs = now.getTime();
  const idle = { start, end, remainingMs: 0, progress: 0 };

  if (task.is_completed) {
    return { ...idle, status: 'done' };
  }

  if (startedAt) {
    if (nowMs >= end.getTime()) {
      return { ...idle, status: 'overdue' };
    }
    return {
      status: 'in-progress',
      start,
      end,
      remainingMs: end.getTime() - nowMs,
      progress: Math.min(
        1,
        Math.max(0, (nowMs - start.getTime()) / durationMs),
      ),
    };
  }

  if (nowMs < start.getTime()) {
    return {
      ...idle,
      status: 'upcoming',
      remainingMs: start.getTime() - nowMs,
    };
  }
  if (nowMs < start.getTime() + START_GRACE_MINUTES * MS_PER_MINUTE) {
    return { ...idle, status: 'awaiting-start' };
  }
  return { ...idle, status: 'missed' };
}

export type TaskWithInfo<T> = { task: T; info: TaskTimeInfo };

export type CurrentTask<T> = TaskWithInfo<T> & {
  otherInProgressCount: number;
};

// The task to show on the Now card. A task still counting down wins; if none is,
// a started task whose time ran out (still waiting to be completed) is shown.
// Overlapping tasks: the one ending first.
export function getCurrentTask<T extends TimedTask>(
  tasks: readonly T[],
  now: Date,
): CurrentTask<T> | null {
  const byEnd = (a: TaskWithInfo<T>, b: TaskWithInfo<T>) =>
    a.info.end.getTime() - b.info.end.getTime();
  const withInfo = tasks.map(task => ({
    task,
    info: getTaskTimeInfo(task, now),
  }));
  const inProgress = withInfo
    .filter(item => item.info.status === 'in-progress')
    .sort(byEnd);
  if (inProgress.length > 0) {
    return { ...inProgress[0], otherInProgressCount: inProgress.length - 1 };
  }
  const timeUp = withInfo
    .filter(item => item.info.status === 'overdue')
    .sort(byEnd);
  return timeUp.length > 0 ? { ...timeUp[0], otherInProgressCount: 0 } : null;
}

// The nearest task today that has not been started and can still be started.
export function getNextTask<T extends TimedTask>(
  tasks: readonly T[],
  now: Date,
): TaskWithInfo<T> | null {
  const today = now.toLocaleDateString('en-CA');
  const candidates = tasks
    .filter(task => task.due_date === today)
    .map(task => ({ task, info: getTaskTimeInfo(task, now) }))
    .filter(
      item =>
        item.info.status === 'upcoming' ||
        item.info.status === 'awaiting-start',
    )
    .sort((a, b) => a.info.start.getTime() - b.info.start.getTime());
  return candidates[0] ?? null;
}

// A task that can still be acted on: not started yet, or in progress. Finished,
// missed and timed-out tasks are not "actual" any more.
export function isTaskActive(task: TimedTask, now: Date): boolean {
  const { status } = getTaskTimeInfo(task, now);
  return (
    status === 'upcoming' ||
    status === 'awaiting-start' ||
    status === 'in-progress'
  );
}

// Incomplete tasks first (by date, then time), completed tasks at the bottom.
// Returns a new array.
export function sortTasksCompletedLast<T extends TaskTiming>(
  tasks: readonly T[],
): T[] {
  return [...tasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    if (a.due_date !== b.due_date) {
      return a.due_date < b.due_date ? -1 : 1;
    }
    if (a.scheduled_time !== b.scheduled_time) {
      return a.scheduled_time < b.scheduled_time ? -1 : 1;
    }
    return 0;
  });
}
