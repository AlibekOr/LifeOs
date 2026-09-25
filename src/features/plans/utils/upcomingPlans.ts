import type { Plan } from '../../../types/plan.types.ts';
import { groupPlansByDate, type PlanListEntry } from './groupPlansByDate.ts';
import { lastDayOf, toDateString } from './planDates.ts';

export const UPCOMING_PLANS_LIMIT = 3;

export type UpcomingPlanEntry<T extends Plan = Plan> = PlanListEntry<T> & {
  // "Tomorrow", "Sat, Oct 10"; null for today.
  dayLabel: string | null;
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// A plan with an end time that has already passed today is over.
function hasEnded(plan: Plan, today: string, nowTime: string): boolean {
  return (
    plan.plan_end_time !== null &&
    lastDayOf(plan) === today &&
    plan.plan_end_time <= nowTime
  );
}

// What Home shows: plans still ahead of the user, today's first, then later
// days in date order. Done, cancelled and finished plans are left out.
export function selectUpcomingPlans<T extends Plan>(
  plans: readonly T[],
  now: Date,
  limit: number = UPCOMING_PLANS_LIMIT,
): UpcomingPlanEntry<T>[] {
  const today = toDateString(now);
  const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
  const open = plans.filter(
    plan => plan.status === 'planned' && !hasEnded(plan, today, nowTime),
  );

  return groupPlansByDate(open, now)
    .filter(section => section.key !== 'past')
    .flatMap(section =>
      section.data.map(entry => ({
        ...entry,
        dayLabel: section.key === 'today' ? null : section.label,
      })),
    )
    .slice(0, limit);
}
