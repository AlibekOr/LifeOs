import { MAX_SCHEDULED_REMINDERS } from '../src/features/tasks/utils/reminderTime.ts';
import {
  alertId,
  alertIds,
  planTaskAlerts,
  selectAlertsToSchedule,
  type AlertTask,
} from '../src/features/tasks/utils/taskAlerts.ts';

const now = new Date(2026, 8, 23, 12, 0, 0);
const at = (hour: number, minute: number, day = 23) =>
  new Date(2026, 8, day, hour, minute, 0);

const task = (
  id: string,
  time: string,
  overrides: Partial<AlertTask> = {},
): AlertTask => ({
  id,
  title: `Task ${id}`,
  is_completed: false,
  due_date: '2026-09-23',
  scheduled_time: time,
  duration_minutes: 30,
  started_at: null,
  ...overrides,
});

describe('alert ids', () => {
  it('are deterministic per task and kind', () => {
    expect(alertId('abc', 'end')).toBe('task-abc-end');
    expect(alertIds('abc')).toEqual([
      'task-abc-lead',
      'task-abc-start',
      'task-abc-end',
    ]);
  });
});

describe('planTaskAlerts — not started', () => {
  it('plans a lead reminder and an alert at the scheduled time', () => {
    const alerts = planTaskAlerts(task('a', '13:00:00'), 10, now);
    expect(alerts.map(a => [a.kind, a.at])).toEqual([
      ['lead', at(12, 50)],
      ['start', at(13, 0)],
    ]);
    expect(alerts[0].body).toBe('Starts at 13:00 · in 10 min');
    expect(alerts[1].title).toBe('Your task time has started');
    expect(alerts[1].body).toBe('Task a');
  });

  it('plans a single alert when the lead is "at start"', () => {
    const alerts = planTaskAlerts(task('a', '13:00:00'), 0, now);
    expect(alerts.map(a => [a.kind, a.at])).toEqual([['lead', at(13, 0)]]);
    expect(alerts[0].body).toBe('Starting now');
  });

  it('does not double up when the lead time already passed', () => {
    // 5 minutes away with a 10 minute lead: the reminder falls back to the start.
    const alerts = planTaskAlerts(task('a', '12:05:00'), 10, now);
    expect(alerts.map(a => [a.kind, a.at])).toEqual([['lead', at(12, 5)]]);
  });

  it('plans nothing when reminders are off', () => {
    expect(planTaskAlerts(task('a', '13:00:00'), null, now)).toEqual([]);
  });

  it('plans nothing once the scheduled time has come', () => {
    expect(planTaskAlerts(task('a', '12:00:00'), 10, now)).toEqual([]);
    expect(planTaskAlerts(task('a', '11:00:00'), 10, now)).toEqual([]);
  });

  it('plans nothing for a completed task', () => {
    expect(
      planTaskAlerts(task('a', '13:00:00', { is_completed: true }), 10, now),
    ).toEqual([]);
  });
});

describe('planTaskAlerts — started', () => {
  const started = (startedAt: Date, duration = 30) =>
    task('a', '09:00:00', {
      started_at: startedAt.toISOString(),
      duration_minutes: duration,
    });

  it('plans an alert for when the time runs out, counted from Start', () => {
    const alerts = planTaskAlerts(started(at(11, 50)), 10, now);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      id: 'task-a-end',
      kind: 'end',
      title: 'Your task time has ended',
    });
    expect(alerts[0].at).toEqual(at(12, 20));
    expect(alerts[0].body).toContain('Task a');
  });

  it('moves the alert when time is added (+15 min)', () => {
    const before = planTaskAlerts(started(at(11, 50), 30), 10, now)[0];
    const after = planTaskAlerts(started(at(11, 50), 45), 10, now)[0];
    expect(after.id).toBe(before.id);
    expect(after.at.getTime() - before.at.getTime()).toBe(15 * 60 * 1000);
  });

  it('plans nothing once the time already ran out', () => {
    expect(planTaskAlerts(started(at(11, 0)), 10, now)).toEqual([]);
  });

  it('plans nothing after completion', () => {
    const done = { ...started(at(11, 50)), is_completed: true };
    expect(planTaskAlerts(done, 10, now)).toEqual([]);
  });

  it('is silent when reminders are off', () => {
    expect(planTaskAlerts(started(at(11, 50)), null, now)).toEqual([]);
  });
});

describe('selectAlertsToSchedule', () => {
  it('orders alerts from all tasks by time', () => {
    const result = selectAlertsToSchedule(
      [task('later', '18:00:00'), task('sooner', '13:00:00')],
      0,
      now,
    );
    expect(result.map(a => a.taskId)).toEqual(['sooner', 'later']);
  });

  it('ignores alerts beyond the 7 day horizon', () => {
    const result = selectAlertsToSchedule(
      [
        task('week', '11:30:00', { due_date: '2026-09-30' }),
        task('far', '12:30:00', { due_date: '2026-10-05' }),
      ],
      10,
      now,
    );
    expect(new Set(result.map(a => a.taskId))).toEqual(new Set(['week']));
  });

  it('keeps only the soonest alerts when over the cap', () => {
    const many = Array.from({ length: MAX_SCHEDULED_REMINDERS + 5 }, (_, i) =>
      task(`t${i}`, '13:00:00', { due_date: '2026-09-24' }),
    );
    expect(selectAlertsToSchedule(many, 10, now)).toHaveLength(
      MAX_SCHEDULED_REMINDERS,
    );
  });

  it('includes the end alert of a running task', () => {
    const running = task('run', '09:00:00', {
      started_at: at(11, 50).toISOString(),
    });
    const result = selectAlertsToSchedule([running], 10, now);
    expect(result.map(a => a.kind)).toEqual(['end']);
  });

  it('returns nothing when reminders are off', () => {
    expect(selectAlertsToSchedule([task('a', '15:00:00')], null, now)).toEqual(
      [],
    );
  });
});
