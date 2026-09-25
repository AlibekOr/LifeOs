import { timeFromString, timeToString } from '../src/utils/timeOfDay.ts';
import {
  DEFAULT_WORK_START_TIME,
  WORK_START_PRESETS,
  workStartIfAhead,
} from '../src/utils/workStart.ts';

// 08:30 local time.
const MORNING = new Date(2026, 9, 4, 8, 30, 0);

describe('workStartIfAhead', () => {
  it('returns the work start while it is still ahead today', () => {
    expect(workStartIfAhead(MORNING, '09:00:00')).toBe('09:00:00');
  });

  it('returns null once it has passed or is right now', () => {
    expect(
      workStartIfAhead(new Date(2026, 9, 4, 15, 0), '09:00:00'),
    ).toBeNull();
    expect(workStartIfAhead(new Date(2026, 9, 4, 9, 0), '09:00:00')).toBeNull();
  });

  it('is still ahead until the minute it starts', () => {
    expect(workStartIfAhead(new Date(2026, 9, 4, 8, 59, 59), '09:00:00')).toBe(
      '09:00:00',
    );
  });

  it('returns null when the work start is unknown', () => {
    expect(workStartIfAhead(MORNING, undefined)).toBeNull();
    expect(workStartIfAhead(MORNING, null)).toBeNull();
  });

  it('accepts a time without seconds', () => {
    expect(workStartIfAhead(MORNING, '10:00')).toBe('10:00:00');
  });
});

describe('work start presets', () => {
  it('includes the default and stays in HH:MM:SS shape', () => {
    expect(WORK_START_PRESETS).toContain(DEFAULT_WORK_START_TIME);
    WORK_START_PRESETS.forEach(time => expect(time).toMatch(/^\d\d:\d\d:00$/));
  });
});

describe('timeOfDay', () => {
  it('formats a picked time as HH:MM:00', () => {
    expect(timeToString(new Date(2026, 9, 4, 7, 5))).toBe('07:05:00');
  });

  it('round-trips through the picker date', () => {
    expect(timeToString(timeFromString('13:45:00'))).toBe('13:45:00');
    expect(timeToString(timeFromString('08:05'))).toBe('08:05:00');
  });
});
