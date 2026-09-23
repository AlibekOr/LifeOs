import {
  MAX_SCHEDULED_REMINDERS,
  getReminderTime,
  selectRemindersToSchedule,
} from '../src/features/tasks/utils/reminderTime.ts';

const now = new Date(2026, 8, 23, 12, 0, 0);
const at = (hour: number, minute: number, day = 23) =>
  new Date(2026, 8, day, hour, minute, 0);

describe('getReminderTime', () => {
  it('fires the lead time before the start', () => {
    expect(getReminderTime(at(13, 0), 10, now)).toEqual(at(12, 50));
  });

  it('fires at the start when the lead is 0', () => {
    expect(getReminderTime(at(13, 0), 0, now)).toEqual(at(13, 0));
  });

  it('returns null when reminders are off', () => {
    expect(getReminderTime(at(13, 0), null, now)).toBeNull();
  });

  it('returns null once the task has started', () => {
    expect(getReminderTime(at(11, 59), 10, now)).toBeNull();
  });

  it('returns null for a task starting exactly now', () => {
    expect(getReminderTime(at(12, 0), 10, now)).toBeNull();
  });

  it('falls back to the start when the lead time already passed', () => {
    // 5 minutes away with a 10 minute lead: 11:55 is already gone.
    expect(getReminderTime(at(12, 5), 10, now)).toEqual(at(12, 5));
  });

  it('fires at the lead time when it is still one minute away', () => {
    expect(getReminderTime(at(12, 11), 10, now)).toEqual(at(12, 1));
  });

  it('returns null for an invalid date', () => {
    expect(getReminderTime(new Date('nope'), 10, now)).toBeNull();
  });
});

describe('selectRemindersToSchedule', () => {
  const task = (
    id: string,
    time: string,
    overrides: Partial<{ is_completed: boolean; due_date: string }> = {},
  ) => ({
    id,
    is_completed: false,
    due_date: '2026-09-23',
    scheduled_time: time,
    ...overrides,
  });

  it('skips completed tasks and tasks that already started', () => {
    const result = selectRemindersToSchedule(
      [
        task('done', '15:00:00', { is_completed: true }),
        task('past', '09:00:00'),
        task('ok', '15:00:00'),
      ],
      10,
      now,
    );
    expect(result.map(item => item.task.id)).toEqual(['ok']);
  });

  it('orders by reminder time, soonest first', () => {
    const result = selectRemindersToSchedule(
      [task('later', '18:00:00'), task('sooner', '13:00:00')],
      10,
      now,
    );
    expect(result.map(item => item.task.id)).toEqual(['sooner', 'later']);
  });

  it('ignores tasks beyond the 7 day horizon', () => {
    const result = selectRemindersToSchedule(
      [
        // Reminder at 11:20 on the 30th, just inside 7 days from 12:00 on the 23rd.
        task('week', '11:30:00', { due_date: '2026-09-30' }),
        task('far', '12:30:00', { due_date: '2026-10-05' }),
      ],
      10,
      now,
    );
    expect(result.map(item => item.task.id)).toEqual(['week']);
  });

  it('keeps only the soonest reminders when over the cap', () => {
    const many = Array.from({ length: MAX_SCHEDULED_REMINDERS + 5 }, (_, i) =>
      task(`t${i}`, '13:00:00', { due_date: '2026-09-24' }),
    );
    expect(selectRemindersToSchedule(many, 10, now)).toHaveLength(
      MAX_SCHEDULED_REMINDERS,
    );
  });

  it('returns nothing when reminders are off', () => {
    expect(
      selectRemindersToSchedule([task('a', '15:00:00')], null, now),
    ).toEqual([]);
  });
});
