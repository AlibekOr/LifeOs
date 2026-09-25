import type {
  DisplayPlan,
  PendingEntry,
  PendingPlanEntry,
} from '../../../types/pendingSync.types.ts';
import type { Plan, PlanRange } from '../../../types/plan.types.ts';
import { lastDayOf } from './planDates.ts';

type PendingPlanCreate = Extract<PendingPlanEntry, { operation: 'create' }>;

export function buildLocalPlan(entry: PendingPlanCreate): Plan {
  const { payload } = entry;
  return {
    id: entry.id,
    user_id: entry.userId,
    title: payload.title,
    location: payload.location ?? null,
    notes: payload.notes ?? null,
    plan_date: payload.plan_date,
    end_date: payload.end_date ?? null,
    plan_time: payload.plan_time ?? null,
    plan_end_time: payload.plan_end_time ?? null,
    remind_minutes_before: payload.remind_minutes_before ?? null,
    remind_time: payload.remind_time ?? null,
    status: payload.status ?? 'planned',
    created_at: entry.queuedAt,
    updated_at: entry.queuedAt,
  };
}

// A plan belongs to a range when it starts on or before the range's last day
// and ends on or after its first day.
export function planOverlapsRange(plan: Plan, range: PlanRange): boolean {
  return plan.plan_date <= range.to && lastDayOf(plan) >= range.from;
}

function compareBySchedule(a: Plan, b: Plan) {
  if (a.plan_date !== b.plan_date) {
    return a.plan_date < b.plan_date ? -1 : 1;
  }
  if (a.plan_time !== b.plan_time) {
    // All-day plans (no time) go last.
    if (a.plan_time === null) {
      return 1;
    }
    if (b.plan_time === null) {
      return -1;
    }
    return a.plan_time < b.plan_time ? -1 : 1;
  }
  return 0;
}

function isPlanEntry(entry: PendingEntry): entry is PendingPlanEntry {
  return entry.entity === 'plan';
}

// Overlays unsynced local changes on top of confirmed server data. Every item
// keeps a syncStatus so the UI never presents a local entry as saved. With a
// range, plans a local edit moved outside of it are dropped.
export function mergePendingPlans(
  serverPlans: Plan[] | undefined,
  entries: PendingEntry[],
  range?: PlanRange,
): DisplayPlan[] {
  const planEntries = entries.filter(isPlanEntry);
  const entriesById = new Map(planEntries.map(entry => [entry.id, entry]));
  const serverIds = new Set<string>();

  const merged: DisplayPlan[] = (serverPlans ?? []).map(plan => {
    serverIds.add(plan.id);
    const entry = entriesById.get(plan.id);
    if (!entry) {
      return { ...plan, syncStatus: 'synced' };
    }
    return { ...plan, ...entry.payload, syncStatus: entry.status };
  });

  planEntries.forEach(entry => {
    if (entry.operation === 'create' && !serverIds.has(entry.id)) {
      merged.push({ ...buildLocalPlan(entry), syncStatus: entry.status });
    }
  });

  return merged
    .filter(plan => !range || planOverlapsRange(plan, range))
    .sort(compareBySchedule);
}
