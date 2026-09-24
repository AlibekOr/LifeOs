import { getReminderTime } from '../src/features/tasks/utils/reminderTime.ts';

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
