import { currentYearMonth, shiftYearMonth } from './month.ts';

// The neighbour of `current` in `options`; stays put at either end.
export function stepOption<T>(
  options: readonly T[],
  current: T,
  delta: 1 | -1,
): T {
  const index = options.indexOf(current);
  if (index === -1) {
    return current;
  }
  const next = Math.min(Math.max(index + delta, 0), options.length - 1);
  return options[next];
}

// "2026-10" -> a number that grows with time, to tell which way a month moved.
export function monthIndex(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);
  return year * 12 + month;
}

// A swipe to the previous or next month. Future months hold no data, so the
// month never goes past the current one (the same rule as the month buttons).
export function swipeMonth(
  yearMonth: string,
  delta: 1 | -1,
  latest: string = currentYearMonth(),
): string {
  if (delta === 1 && yearMonth >= latest) {
    return yearMonth;
  }
  return shiftYearMonth(yearMonth, delta);
}
