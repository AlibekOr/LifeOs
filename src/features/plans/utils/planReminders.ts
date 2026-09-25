import type { Plan } from '../../../types/plan.types.ts';
import { formatTimeShort } from './planFormatting.ts';

export const PLAN_ALERT_ID_PREFIX = 'plan-';
// iOS keeps at most ~64 pending local notifications and task alerts already use
// most of them, so plan reminders stay few and near. Reminders further out are
// scheduled once they come within reach (the sync runs on start and foreground).
export const PLAN_REMINDER_HORIZON_DAYS = 30;
export const MAX_SCHEDULED_PLAN_REMINDERS = 20;

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

export type ReminderPlan = Pick<
  Plan,
  | 'id'
  | 'title'
  | 'location'
  | 'status'
  | 'plan_date'
  | 'plan_time'
  | 'remind_minutes_before'
  | 'remind_time'
>;

export type PlannedPlanAlert = {
  id: string;
  planId: string;
  at: Date;
  title: string;
  body: string | undefined;
};

// Deterministic, so scheduling a plan's reminder again replaces it instead of
// stacking a duplicate.
export const planAlertId = (planId: string) =>
  `${PLAN_ALERT_ID_PREFIX}${planId}`;

// "YYYY-MM-DD" + "HH:MM:SS" as a moment in the device's own time zone. Building
// it from parts avoids `new Date("2026-10-03")`, which is read as UTC.
function localMoment(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

// When a plan's reminder is due, ignoring whether that moment has passed.
//  - timed plan: the chosen number of minutes before it starts;
//  - all-day plan: the time of day the user picked, on its first day.
// A multi-day plan is only reminded before its start, never on later days.
export function getPlanReminderTime(plan: ReminderPlan): Date | null {
  if (plan.status !== 'planned') {
    return null;
  }
  if (plan.plan_time && plan.remind_minutes_before !== null) {
    const start = localMoment(plan.plan_date, plan.plan_time);
    return new Date(
      start.getTime() - plan.remind_minutes_before * MS_PER_MINUTE,
    );
  }
  if (!plan.plan_time && plan.remind_time) {
    return localMoment(plan.plan_date, plan.remind_time);
  }
  return null;
}

function reminderBody(plan: ReminderPlan): string | undefined {
  const parts: string[] = [];
  if (plan.plan_time) {
    parts.push(`Starts at ${formatTimeShort(plan.plan_time)}`);
  }
  if (plan.location) {
    parts.push(plan.location);
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

// The alert a plan should have right now, or null: no reminder chosen, plan
// done or cancelled, the reminder time already passed, or too far ahead.
export function buildPlanAlert(
  plan: ReminderPlan,
  now: Date,
  horizonDays: number = PLAN_REMINDER_HORIZON_DAYS,
): PlannedPlanAlert | null {
  const at = getPlanReminderTime(plan);
  if (!at) {
    return null;
  }
  const nowMs = now.getTime();
  if (
    at.getTime() <= nowMs ||
    at.getTime() > nowMs + horizonDays * MS_PER_DAY
  ) {
    return null;
  }
  return {
    id: planAlertId(plan.id),
    planId: plan.id,
    at,
    title: `Plan: ${plan.title}`,
    body: reminderBody(plan),
  };
}

// The alerts worth having scheduled right now, soonest first.
export function selectPlanAlertsToSchedule(
  plans: readonly ReminderPlan[],
  now: Date,
  cap: number = MAX_SCHEDULED_PLAN_REMINDERS,
): PlannedPlanAlert[] {
  return plans
    .map(plan => buildPlanAlert(plan, now))
    .filter((alert): alert is PlannedPlanAlert => alert !== null)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, cap);
}
