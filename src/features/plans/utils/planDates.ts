import type { Plan, PlanRange } from '../../../types/plan.types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const PAST_DAYS_SHOWN = 30;
const FUTURE_DAYS_SHOWN = 365;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// Date-only strings are compared and shifted in UTC so daylight-saving changes
// can never move a plan by a day.
function utcDay(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

// Local calendar date, "YYYY-MM-DD" (same format as plan_date).
export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

export function addDays(date: string, days: number): string {
  const shifted = new Date(utcDay(date) + days * DAY_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate(),
  )}`;
}

// Whole days from `earlier` to `later`; negative when `later` comes first.
export function diffDays(later: string, earlier: string): number {
  return Math.round((utcDay(later) - utcDay(earlier)) / DAY_MS);
}

export function lastDayOf(plan: Pick<Plan, 'plan_date' | 'end_date'>): string {
  return plan.end_date ?? plan.plan_date;
}

// One range for every screen, so Home and the Plans tab share a single cached
// query instead of fetching twice.
export function planRangeFor(today: string): PlanRange {
  return {
    from: addDays(today, -PAST_DAYS_SHOWN),
    to: addDays(today, FUTURE_DAYS_SHOWN),
  };
}

export function getDefaultPlanRange(now: Date): PlanRange {
  return planRangeFor(toDateString(now));
}
