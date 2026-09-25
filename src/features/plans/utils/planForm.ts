import type { CreatePlanInput, Plan } from '../../../types/plan.types.ts';
import {
  DEFAULT_WORK_START_TIME,
  workStartIfAhead,
} from '../../../utils/workStart.ts';
import { addDays, toDateString } from './planDates.ts';

export type TimedReminder = 'None' | '15 min' | '1 h' | '1 day';

export type PlanFormValues = {
  title: string;
  location: string;
  notes: string;
  // "YYYY-MM-DD"
  planDate: string;
  multiDay: boolean;
  endDate: string;
  // false = all-day plan
  hasTime: boolean;
  // "HH:MM:SS"
  startTime: string;
  hasEndTime: boolean;
  endTime: string;
  // Reminder of a timed plan, counted back from its start time.
  reminder: TimedReminder;
  // Reminder of an all-day plan, at a time of day the user picks.
  hasAllDayReminder: boolean;
  remindTime: string;
};

export type PlanFormErrors = {
  title?: string;
  endDate?: string;
  endTime?: string;
};

export const TIMED_REMINDER_OPTIONS: TimedReminder[] = [
  'None',
  '15 min',
  '1 h',
  '1 day',
];

const REMINDER_MINUTES: Record<Exclude<TimedReminder, 'None'>, number> = {
  '15 min': 15,
  '1 h': 60,
  '1 day': 24 * 60,
};

export const TITLE_MAX_LENGTH = 120;
export const LOCATION_MAX_LENGTH = 200;
export const NOTES_MAX_LENGTH = 1000;

const LAST_MINUTE_OF_DAY = 23 * 60 + 59;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function dateFromString(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Stops at 23:59: a plan never runs past midnight by accident. Overnight plans
// use "Multiple days" with the next day as the end date.
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const total = Math.min(hours * 60 + mins + minutes, LAST_MINUTE_OF_DAY);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}:00`;
}

// New plans start when the working day starts, if that is still ahead today;
// otherwise at the next full hour. `workStart` comes from the user's profile.
export function defaultPlanFormValues(
  now: Date,
  workStart?: string | null,
): PlanFormValues {
  const planDate = toDateString(now);
  const startTime =
    workStartIfAhead(now, workStart) ??
    `${pad(Math.min(now.getHours() + 1, 23))}:00:00`;
  return {
    title: '',
    location: '',
    notes: '',
    planDate,
    multiDay: false,
    endDate: addDays(planDate, 1),
    hasTime: false,
    startTime,
    hasEndTime: false,
    endTime: addMinutesToTime(startTime, 60),
    reminder: 'None',
    hasAllDayReminder: false,
    remindTime: workStart ?? DEFAULT_WORK_START_TIME,
  };
}

function reminderFromMinutes(minutes: number | null): TimedReminder {
  const match = (
    Object.entries(REMINDER_MINUTES) as [
      Exclude<TimedReminder, 'None'>,
      number,
    ][]
  ).find(([, value]) => value === minutes);
  return match ? match[0] : 'None';
}

export function planToFormValues(
  plan: Plan,
  workStart?: string | null,
): PlanFormValues {
  const startTime = plan.plan_time ?? workStart ?? DEFAULT_WORK_START_TIME;
  return {
    title: plan.title,
    location: plan.location ?? '',
    notes: plan.notes ?? '',
    planDate: plan.plan_date,
    multiDay: plan.end_date !== null,
    endDate: plan.end_date ?? addDays(plan.plan_date, 1),
    hasTime: plan.plan_time !== null,
    startTime,
    hasEndTime: plan.plan_end_time !== null,
    endTime: plan.plan_end_time ?? addMinutesToTime(startTime, 60),
    reminder: reminderFromMinutes(plan.remind_minutes_before),
    hasAllDayReminder: plan.remind_time !== null,
    remindTime: plan.remind_time ?? workStart ?? DEFAULT_WORK_START_TIME,
  };
}

// Moving the start past the end date drags the end date along.
export function withPlanDate(
  values: PlanFormValues,
  planDate: string,
): PlanFormValues {
  return {
    ...values,
    planDate,
    endDate: values.endDate < planDate ? planDate : values.endDate,
  };
}

export function withMultiDay(
  values: PlanFormValues,
  multiDay: boolean,
): PlanFormValues {
  if (!multiDay) {
    return { ...values, multiDay: false };
  }
  return {
    ...values,
    multiDay: true,
    endDate:
      values.endDate > values.planDate
        ? values.endDate
        : addDays(values.planDate, 1),
  };
}

// A "multiple days" plan whose end date equals the start is just one day.
export function effectiveEndDate(values: PlanFormValues): string | null {
  return values.multiDay && values.endDate > values.planDate
    ? values.endDate
    : null;
}

export function validatePlanForm(values: PlanFormValues): PlanFormErrors {
  const errors: PlanFormErrors = {};

  if (values.title.trim().length === 0) {
    errors.title = 'Please enter a title.';
  }
  if (values.multiDay && values.endDate < values.planDate) {
    errors.endDate = 'End date must be on or after the start date.';
  }
  if (values.hasTime && values.hasEndTime) {
    const endDay = effectiveEndDate(values) ?? values.planDate;
    const end = `${endDay}T${values.endTime}`;
    if (end <= `${values.planDate}T${values.startTime}`) {
      errors.endTime = 'End time must be after the start time.';
    }
  }
  return errors;
}

export function buildPlanInput(values: PlanFormValues): CreatePlanInput {
  const location = values.location.trim();
  const notes = values.notes.trim();

  return {
    title: values.title.trim(),
    location: location.length > 0 ? location : null,
    notes: notes.length > 0 ? notes : null,
    plan_date: values.planDate,
    end_date: effectiveEndDate(values),
    plan_time: values.hasTime ? values.startTime : null,
    plan_end_time: values.hasTime && values.hasEndTime ? values.endTime : null,
    remind_minutes_before:
      values.hasTime && values.reminder !== 'None'
        ? REMINDER_MINUTES[values.reminder]
        : null,
    remind_time:
      !values.hasTime && values.hasAllDayReminder ? values.remindTime : null,
  };
}
