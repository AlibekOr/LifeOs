import {
  addDays,
  diffDays,
  getDefaultPlanRange,
  lastDayOf,
  toDateString,
} from '../src/features/plans/utils/planDates.ts';

describe('planDates', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-09-29', 5)).toBe('2026-10-04');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-10-04', -4)).toBe('2026-09-30');
  });

  it('handles leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('counts whole days between dates', () => {
    expect(diffDays('2026-10-05', '2026-09-29')).toBe(6);
    expect(diffDays('2026-10-03', '2026-10-03')).toBe(0);
    expect(diffDays('2026-10-01', '2026-10-03')).toBe(-2);
  });

  it('uses plan_date as the last day of a single-day plan', () => {
    expect(lastDayOf({ plan_date: '2026-10-03', end_date: null })).toBe(
      '2026-10-03',
    );
    expect(lastDayOf({ plan_date: '2026-10-03', end_date: '2026-10-05' })).toBe(
      '2026-10-05',
    );
  });

  it('builds a default range around today', () => {
    expect(getDefaultPlanRange(new Date(2026, 9, 4, 12))).toEqual({
      from: '2026-09-04',
      to: '2027-10-04',
    });
  });
});
