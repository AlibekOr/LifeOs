export const REMINDER_HORIZON_DAYS = 7;
// iOS keeps at most ~64 pending local notifications; stay below that.
export const MAX_SCHEDULED_REMINDERS = 60;

const MS_PER_MINUTE = 60 * 1000;

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
