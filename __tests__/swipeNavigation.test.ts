import {
  monthIndex,
  stepOption,
  swipeMonth,
} from '../src/features/finance/utils/swipeNavigation.ts';

const FILTERS = ['All', 'Expenses', 'Income'] as const;

describe('stepOption', () => {
  it('moves to the next and previous option', () => {
    expect(stepOption(FILTERS, 'All', 1)).toBe('Expenses');
    expect(stepOption(FILTERS, 'Income', -1)).toBe('Expenses');
  });

  it('stays at either end', () => {
    expect(stepOption(FILTERS, 'Income', 1)).toBe('Income');
    expect(stepOption(FILTERS, 'All', -1)).toBe('All');
  });

  it('keeps an unknown value as it is', () => {
    expect(stepOption(FILTERS, 'Other' as 'All', 1)).toBe('Other');
  });
});

describe('monthIndex', () => {
  it('grows with time, across years', () => {
    expect(monthIndex('2026-10')).toBeGreaterThan(monthIndex('2026-09'));
    expect(monthIndex('2027-01')).toBe(monthIndex('2026-12') + 1);
  });
});

describe('swipeMonth', () => {
  it('goes to the previous month, across a year boundary', () => {
    expect(swipeMonth('2026-10', -1, '2026-10')).toBe('2026-09');
    expect(swipeMonth('2026-01', -1, '2026-10')).toBe('2025-12');
  });

  it('goes to the next month up to the latest one', () => {
    expect(swipeMonth('2026-08', 1, '2026-10')).toBe('2026-09');
    expect(swipeMonth('2026-09', 1, '2026-10')).toBe('2026-10');
  });

  it('never goes past the latest month', () => {
    expect(swipeMonth('2026-10', 1, '2026-10')).toBe('2026-10');
  });
});
