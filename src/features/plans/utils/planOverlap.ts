import type { Plan } from '../../../types/plan.types.ts';

type PlanSlot = Pick<
  Plan,
  'plan_date' | 'end_date' | 'plan_time' | 'plan_end_time' | 'status'
>;

// Mirrors the plans_prevent_overlap trigger so the form can warn before saving,
// also while offline.
//   - A plan with an end time occupies [start, end).
//   - A plan without one is only a start moment: it blocks nothing, but it may
//     not start inside another plan's interval.
//   - All-day and cancelled plans never conflict.
// Timestamps are "YYYY-MM-DDTHH:MM:SS", which compare correctly as strings.

function startOf(plan: PlanSlot): string {
  return `${plan.plan_date}T${plan.plan_time}`;
}

function endOf(plan: PlanSlot): string | null {
  return plan.plan_end_time
    ? `${plan.end_date ?? plan.plan_date}T${plan.plan_end_time}`
    : null;
}

function occupiesTime(plan: PlanSlot): boolean {
  return plan.status !== 'cancelled' && plan.plan_time !== null;
}

function conflicts(a: PlanSlot, b: PlanSlot): boolean {
  const aStart = startOf(a);
  const bStart = startOf(b);
  const aEnd = endOf(a);
  const bEnd = endOf(b);

  if (aEnd && bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }
  if (aEnd) {
    return bStart >= aStart && bStart < aEnd;
  }
  if (bEnd) {
    return aStart >= bStart && aStart < bEnd;
  }
  return false;
}

export function findOverlappingPlan<T extends Plan>(
  candidate: PlanSlot & { id?: string },
  others: readonly T[],
): T | undefined {
  if (!occupiesTime(candidate)) {
    return undefined;
  }
  return others.find(
    other =>
      other.id !== candidate.id &&
      occupiesTime(other) &&
      conflicts(candidate, other),
  );
}
