import {
  formatClock,
  formatTimeRange,
} from '../src/features/tasks/utils/taskFormatting.ts';

describe('formatTimeRange', () => {
  it('joins start and end with an en dash', () => {
    expect(
      formatTimeRange(
        new Date(2026, 8, 23, 14, 0),
        new Date(2026, 8, 23, 16, 5),
      ),
    ).toBe('14:00 – 16:05');
  });
});

describe('formatClock', () => {
  it('pads hours and minutes', () => {
    expect(formatClock(new Date(2026, 8, 23, 9, 5))).toBe('09:05');
  });

  it('uses the 24 hour clock', () => {
    expect(formatClock(new Date(2026, 8, 23, 23, 59))).toBe('23:59');
    expect(formatClock(new Date(2026, 8, 23, 0, 0))).toBe('00:00');
  });
});
