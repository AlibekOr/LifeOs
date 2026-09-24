import type { Task } from '../../../types/task.types.ts';
import {
  MAX_SCHEDULED_REMINDERS,
  REMINDER_HORIZON_DAYS,
  getReminderTime,
} from './reminderTime.ts';
import { formatTime } from './taskFormatting.ts';
import { getTaskStart, getTaskTimeInfo } from './taskStatus.ts';

// lead: the reminder before the start (the Profile setting).
// start: the moment the scheduled time arrives.
// end: the moment a started task runs out of time.
export type AlertKind = 'lead' | 'start' | 'end';

export type AlertTask = Pick<
  Task,
  | 'id'
  | 'title'
  | 'is_completed'
  | 'due_date'
  | 'scheduled_time'
  | 'duration_minutes'
  | 'started_at'
>;

export type PlannedAlert = {
  id: string;
  taskId: string;
  kind: AlertKind;
  at: Date;
  title: string;
  body: string;
};

export const ALERT_KINDS: readonly AlertKind[] = ['lead', 'start', 'end'];

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

// Deterministic, so scheduling the same alert again replaces it instead of
// stacking a duplicate.
export const alertId = (taskId: string, kind: AlertKind) =>
  `task-${taskId}-${kind}`;

export const alertIds = (taskId: string) =>
  ALERT_KINDS.map(kind => alertId(taskId, kind));

function leadBody(task: AlertTask, at: Date): string {
  const minutesAhead = Math.round(
    (getTaskStart(task).getTime() - at.getTime()) / MS_PER_MINUTE,
  );
  return minutesAhead > 0
    ? `Starts at ${formatTime(task.scheduled_time)} · in ${minutesAhead} min`
    : 'Starting now';
}

// The alerts a task should have right now. `leadMinutes` null means the user
// turned reminders off, which silences every alert.
//  - not started yet: the lead reminder, plus one at the scheduled time (unless
//    the lead reminder already fires then);
//  - started and running: one when its time runs out.
// Nothing is planned for times already in the past.
export function planTaskAlerts(
  task: AlertTask,
  leadMinutes: number | null,
  now: Date,
): PlannedAlert[] {
  if (leadMinutes === null) {
    return [];
  }
  const info = getTaskTimeInfo(task, now);

  if (info.status === 'in-progress') {
    return [
      {
        id: alertId(task.id, 'end'),
        taskId: task.id,
        kind: 'end',
        at: info.end,
        title: 'Your task time has ended',
        body: `${task.title} · Open LifeOS to complete it or add time.`,
      },
    ];
  }
  if (info.status !== 'upcoming') {
    return [];
  }

  const leadAt = getReminderTime(info.start, leadMinutes, now);
  if (!leadAt) {
    return [];
  }
  const alerts: PlannedAlert[] = [
    {
      id: alertId(task.id, 'lead'),
      taskId: task.id,
      kind: 'lead',
      at: leadAt,
      title: task.title,
      body: leadBody(task, leadAt),
    },
  ];
  if (leadAt.getTime() < info.start.getTime()) {
    alerts.push({
      id: alertId(task.id, 'start'),
      taskId: task.id,
      kind: 'start',
      at: info.start,
      title: 'Your task time has started',
      body: task.title,
    });
  }
  return alerts;
}

// The alerts worth having scheduled right now: within the next week, soonest
// first, capped for the OS limit (iOS keeps at most ~64 pending notifications).
export function selectAlertsToSchedule(
  tasks: readonly AlertTask[],
  leadMinutes: number | null,
  now: Date,
  cap: number = MAX_SCHEDULED_REMINDERS,
): PlannedAlert[] {
  const horizon = now.getTime() + REMINDER_HORIZON_DAYS * MS_PER_DAY;
  return tasks
    .flatMap(task => planTaskAlerts(task, leadMinutes, now))
    .filter(alert => alert.at.getTime() <= horizon)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, cap);
}
