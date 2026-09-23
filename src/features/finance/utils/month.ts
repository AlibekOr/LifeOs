// Months are handled as "YYYY-MM" strings in local time, matching the
// `occurred_on` date column.

function toYearMonth(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function fromYearMonth(yearMonth: string): Date {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

export function currentYearMonth(): string {
  return toYearMonth(new Date());
}

export function yearMonthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function shiftYearMonth(yearMonth: string, deltaMonths: number): string {
  const date = fromYearMonth(yearMonth);
  date.setMonth(date.getMonth() + deltaMonths);
  return toYearMonth(date);
}

export function recentYearMonths(count: number): string[] {
  const current = currentYearMonth();
  return Array.from({ length: count }, (_, index) =>
    shiftYearMonth(current, -index),
  );
}

export function formatYearMonth(yearMonth: string): string {
  return fromYearMonth(yearMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatMonthName(yearMonth: string): string {
  return fromYearMonth(yearMonth).toLocaleDateString('en-US', {
    month: 'long',
  });
}
