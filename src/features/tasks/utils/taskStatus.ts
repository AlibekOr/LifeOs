import type { Task } from '../../../types/task.types.ts';

type TaskTiming = Pick<Task, 'is_completed' | 'due_date' | 'scheduled_time'>;

// due_date is "YYYY-MM-DD" and scheduled_time "HH:mm[:ss]", both local time.
export function getTaskStart(
  task: Pick<Task, 'due_date' | 'scheduled_time'>,
): Date {
  return new Date(`${task.due_date}T${task.scheduled_time}`);
}

// Overdue = not completed and the start time is strictly before `now`. A task
// starting exactly now is not overdue yet.
export function isTaskOverdue(task: TaskTiming, now: Date): boolean {
  if (task.is_completed) {
    return false;
  }
  return getTaskStart(task).getTime() < now.getTime();
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
