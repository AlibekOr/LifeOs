import type { Task } from '../../../types/task.types.ts';
import { getTaskStart } from './taskStatus.ts';

type ReminderTask = Pick<
  Task,
  'id' | 'is_completed' | 'due_date' | 'scheduled_time'
>;

export const REMINDER_HORIZON_DAYS = 7;
// iOS keeps at most ~64 pending local notifications; stay below that.
export const MAX_SCHEDULED_REMINDERS = 60;

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

// When to notify for a task starting at `start`. Null when there is nothing to
// schedule: reminders are off, or the task has already started.
// If the lead time has already passed but the task has not started (e.g. a task
// created 5 minutes ahead with a 10 minute lead), notify at the start instead of
// firing immediately.
export function getReminderTime(
  start: Date,
  leadMinutes: number | null,
  now: Date,
): Date | null {
  if (leadMinutes === null) {
    return null;
  }
  const startMs = start.getTime();
  if (Number.isNaN(startMs) || startMs <= now.getTime()) {
    return null;
  }
  const reminderMs = startMs - leadMinutes * MS_PER_MINUTE;
  return new Date(reminderMs > now.getTime() ? reminderMs : startMs);
}

export type PlannedReminder<T extends ReminderTask> = { task: T; at: Date };

// The reminders worth having scheduled right now: unfinished tasks within the
// next week, soonest first, capped for the OS limit.
export function selectRemindersToSchedule<T extends ReminderTask>(
  tasks: readonly T[],
  leadMinutes: number | null,
  now: Date,
  cap: number = MAX_SCHEDULED_REMINDERS,
): PlannedReminder<T>[] {
  const horizon = now.getTime() + REMINDER_HORIZON_DAYS * MS_PER_DAY;
  const planned: PlannedReminder<T>[] = [];
  tasks.forEach(task => {
    if (task.is_completed) {
      return;
    }
    const at = getReminderTime(getTaskStart(task), leadMinutes, now);
    if (at && at.getTime() <= horizon) {
      planned.push({ task, at });
    }
  });
  return planned.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, cap);
}
