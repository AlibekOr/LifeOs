import type { Plan } from '../../../types/plan.types.ts';
import { lastDayOf } from './planDates.ts';

type PlanSlotLike = Pick<
  Plan,
  'plan_date' | 'end_date' | 'plan_time' | 'plan_end_time'
>;

// "HH:MM:SS" -> "HH:MM", the same 24-hour shape the task list uses.
export function formatTimeShort(time: string): string {
  return time.slice(0, 5);
}

// "2026-10-03" -> "Oct 3"
export function formatDayShort(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// "Oct 3 – Oct 5"; null for a single-day plan.
export function formatPlanDateRange(plan: PlanSlotLike): string | null {
  const last = lastDayOf(plan);
  return last === plan.plan_date
    ? null
    : `${formatDayShort(plan.plan_date)} – ${formatDayShort(last)}`;
}

// "14:00 – 19:00", "14:00", or null for an all-day plan.
export function formatPlanTimeSpan(plan: PlanSlotLike): string | null {
  if (!plan.plan_time) {
    return null;
  }
  const start = formatTimeShort(plan.plan_time);
  return plan.plan_end_time
    ? `${start} – ${formatTimeShort(plan.plan_end_time)}`
    : start;
}
