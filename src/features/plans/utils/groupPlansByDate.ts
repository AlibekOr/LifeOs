import type { Plan } from '../../../types/plan.types.ts';
import { addDays, diffDays, lastDayOf, toDateString } from './planDates.ts';

export type PlanProgress = { day: number; total: number };

export type PlanListEntry<T extends Plan = Plan> = {
  plan: T;
  // Set for a multi-day plan while today is inside its range ("Day 2 of 3").
  progress: PlanProgress | null;
};

export type PlanSection<T extends Plan = Plan> = {
  key: string;
  label: string;
  data: PlanListEntry<T>[];
};

function formatSectionLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function compareByTime(a: Plan, b: Plan): number {
  if (a.plan_time !== b.plan_time) {
    // All-day plans (no time) go after timed ones.
    if (a.plan_time === null) {
      return 1;
    }
    if (b.plan_time === null) {
      return -1;
    }
    return a.plan_time < b.plan_time ? -1 : 1;
  }
  return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
}

// Within a day: plans carried over from an earlier start first, then timed
// plans by time, then all-day plans.
function compareWithinDay(day: string) {
  return (a: Plan, b: Plan): number => {
    const aCarried = a.plan_date < day;
    const bCarried = b.plan_date < day;
    if (aCarried !== bCarried) {
      return aCarried ? -1 : 1;
    }
    if (aCarried && a.plan_date !== b.plan_date) {
      return a.plan_date < b.plan_date ? -1 : 1;
    }
    return compareByTime(a, b);
  };
}

function comparePast(a: Plan, b: Plan): number {
  const aLast = lastDayOf(a);
  const bLast = lastDayOf(b);
  if (aLast !== bLast) {
    // Most recent first.
    return aLast < bLast ? 1 : -1;
  }
  return compareByTime(b, a);
}

function toEntry<T extends Plan>(plan: T, today: string): PlanListEntry<T> {
  const last = lastDayOf(plan);
  const isMultiDay = last !== plan.plan_date;
  const containsToday = plan.plan_date <= today && today <= last;
  return {
    plan,
    progress:
      isMultiDay && containsToday
        ? {
            day: diffDays(today, plan.plan_date) + 1,
            total: diffDays(last, plan.plan_date) + 1,
          }
        : null,
  };
}

// A plan sits in the section of its start date. One that started earlier but is
// still running shows under Today; it counts as past only after its last day.
export function groupPlansByDate<T extends Plan>(
  plans: readonly T[],
  now: Date,
): PlanSection<T>[] {
  const today = toDateString(now);
  const tomorrow = addDays(today, 1);

  const todayPlans: T[] = [];
  const tomorrowPlans: T[] = [];
  const futureByDate = new Map<string, T[]>();
  const pastPlans: T[] = [];

  plans.forEach(plan => {
    if (lastDayOf(plan) < today) {
      pastPlans.push(plan);
    } else if (plan.plan_date <= today) {
      todayPlans.push(plan);
    } else if (plan.plan_date === tomorrow) {
      tomorrowPlans.push(plan);
    } else {
      const bucket = futureByDate.get(plan.plan_date) ?? [];
      bucket.push(plan);
      futureByDate.set(plan.plan_date, bucket);
    }
  });

  const section = (
    key: string,
    label: string,
    items: T[],
    day: string,
  ): PlanSection<T> => ({
    key,
    label,
    data: [...items]
      .sort(compareWithinDay(day))
      .map(plan => toEntry(plan, today)),
  });

  const sections: PlanSection<T>[] = [];
  if (todayPlans.length > 0) {
    sections.push(section('today', 'Today', todayPlans, today));
  }
  if (tomorrowPlans.length > 0) {
    sections.push(section('tomorrow', 'Tomorrow', tomorrowPlans, tomorrow));
  }
  [...futureByDate.keys()].sort().forEach(date => {
    sections.push(
      section(
        date,
        formatSectionLabel(date),
        futureByDate.get(date) ?? [],
        date,
      ),
    );
  });
  if (pastPlans.length > 0) {
    sections.push({
      key: 'past',
      label: 'Past',
      data: [...pastPlans].sort(comparePast).map(plan => toEntry(plan, today)),
    });
  }

  return sections;
}
