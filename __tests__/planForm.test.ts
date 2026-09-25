import {
  addMinutesToTime,
  buildPlanInput,
  defaultPlanFormValues,
  planToFormValues,
  validatePlanForm,
  withMultiDay,
  withPlanDate,
  type PlanFormValues,
} from '../src/features/plans/utils/planForm.ts';
import {
  formatDayShort,
  formatPlanDateRange,
  formatPlanTimeSpan,
} from '../src/features/plans/utils/planFormatting.ts';
import type { Plan } from '../src/types/plan.types.ts';

// Sunday, Oct 4 2026, 14:30.
const NOW = new Date(2026, 9, 4, 14, 30, 0);

const form = (overrides: Partial<PlanFormValues> = {}): PlanFormValues => ({
  ...defaultPlanFormValues(NOW),
  title: 'Gym',
  ...overrides,
});

const plan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'p',
  user_id: 'user',
  title: 'Gym',
  location: null,
  notes: null,
  plan_date: '2026-10-04',
  end_date: null,
  plan_time: null,
  plan_end_time: null,
  remind_minutes_before: null,
  remind_time: null,
  status: 'planned',
  created_at: '2026-10-01T00:00:00.000Z',
  updated_at: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

describe('defaultPlanFormValues', () => {
  it('starts as an all-day plan for today', () => {
    const values = defaultPlanFormValues(NOW);
    expect(values.planDate).toBe('2026-10-04');
    expect(values.hasTime).toBe(false);
    expect(values.multiDay).toBe(false);
  });

  it('suggests the next full hour, capped at 23:00', () => {
    expect(defaultPlanFormValues(NOW).startTime).toBe('15:00:00');
    expect(defaultPlanFormValues(new Date(2026, 9, 4, 23, 40)).startTime).toBe(
      '23:00:00',
    );
  });

  it('starts at the work start time while it is still ahead today', () => {
    const values = defaultPlanFormValues(
      new Date(2026, 9, 4, 7, 30),
      '08:00:00',
    );
    expect(values.startTime).toBe('08:00:00');
    expect(values.endTime).toBe('09:00:00');
  });

  it('falls back to the next full hour once the work start has passed', () => {
    expect(defaultPlanFormValues(NOW, '08:00:00').startTime).toBe('15:00:00');
  });

  it("uses the work start time for an all-day plan's reminder", () => {
    expect(defaultPlanFormValues(NOW, '10:00:00').remindTime).toBe('10:00:00');
    expect(defaultPlanFormValues(NOW).remindTime).toBe('09:00:00');
  });
});

describe('time helpers', () => {
  it('adds minutes but never runs past 23:59', () => {
    expect(addMinutesToTime('09:00:00', 60)).toBe('10:00:00');
    expect(addMinutesToTime('23:30:00', 60)).toBe('23:59:00');
  });
});

describe('withPlanDate / withMultiDay', () => {
  it('drags the end date along when the start moves past it', () => {
    const values = form({ multiDay: true, endDate: '2026-10-06' });
    expect(withPlanDate(values, '2026-10-09').endDate).toBe('2026-10-09');
    expect(withPlanDate(values, '2026-10-05').endDate).toBe('2026-10-06');
  });

  it('proposes the next day when multiple days is turned on', () => {
    const values = withMultiDay(form({ planDate: '2026-10-04' }), true);
    expect(values.multiDay).toBe(true);
    expect(values.endDate).toBe('2026-10-05');
  });
});

describe('validatePlanForm', () => {
  it('accepts a valid all-day plan', () => {
    expect(validatePlanForm(form())).toEqual({});
  });

  it('requires a title', () => {
    expect(validatePlanForm(form({ title: '   ' })).title).toBeDefined();
  });

  it('rejects an end date before the start date', () => {
    const errors = validatePlanForm(
      form({ multiDay: true, planDate: '2026-10-05', endDate: '2026-10-04' }),
    );
    expect(errors.endDate).toBeDefined();
  });

  it('rejects an end time that is not after the start time', () => {
    const base = { hasTime: true, hasEndTime: true, startTime: '18:00:00' };
    expect(
      validatePlanForm(form({ ...base, endTime: '18:00:00' })).endTime,
    ).toBeDefined();
    expect(
      validatePlanForm(form({ ...base, endTime: '17:00:00' })).endTime,
    ).toBeDefined();
    expect(
      validatePlanForm(form({ ...base, endTime: '19:00:00' })).endTime,
    ).toBeUndefined();
  });

  it('allows an earlier end time when the plan ends on a later day', () => {
    const errors = validatePlanForm(
      form({
        hasTime: true,
        hasEndTime: true,
        startTime: '22:00:00',
        endTime: '02:00:00',
        multiDay: true,
        endDate: '2026-10-05',
      }),
    );
    expect(errors.endTime).toBeUndefined();
  });
});

describe('buildPlanInput', () => {
  it('builds an all-day plan with an optional reminder time', () => {
    const input = buildPlanInput(
      form({
        title: '  Chorsu bazaar ',
        hasAllDayReminder: true,
        remindTime: '08:00:00',
        // Ignored for an all-day plan.
        reminder: '1 h',
        hasEndTime: true,
      }),
    );
    expect(input).toEqual({
      title: 'Chorsu bazaar',
      location: null,
      notes: null,
      plan_date: '2026-10-04',
      end_date: null,
      plan_time: null,
      plan_end_time: null,
      remind_minutes_before: null,
      remind_time: '08:00:00',
    });
  });

  it('builds a timed plan with a reminder counted from the start', () => {
    const input = buildPlanInput(
      form({
        hasTime: true,
        startTime: '14:00:00',
        hasEndTime: true,
        endTime: '19:00:00',
        reminder: '1 h',
        // Ignored for a timed plan.
        hasAllDayReminder: true,
        location: ' Office ',
      }),
    );
    expect(input).toMatchObject({
      location: 'Office',
      plan_time: '14:00:00',
      plan_end_time: '19:00:00',
      remind_minutes_before: 60,
      remind_time: null,
    });
  });

  it('drops the end time when there is no start time or it is switched off', () => {
    expect(
      buildPlanInput(form({ hasTime: false, hasEndTime: true })).plan_end_time,
    ).toBeNull();
    expect(
      buildPlanInput(form({ hasTime: true, hasEndTime: false })).plan_end_time,
    ).toBeNull();
  });

  it('treats a multi-day plan ending on its start date as one day', () => {
    expect(
      buildPlanInput(form({ multiDay: true, endDate: '2026-10-04' })).end_date,
    ).toBeNull();
    expect(
      buildPlanInput(form({ multiDay: true, endDate: '2026-10-06' })).end_date,
    ).toBe('2026-10-06');
  });
});

describe('planToFormValues', () => {
  it('round-trips a timed multi-day plan', () => {
    const source = plan({
      title: 'Trip',
      location: 'Samarkand',
      notes: 'Bring the camera',
      plan_date: '2026-10-03',
      end_date: '2026-10-05',
      plan_time: '08:00:00',
      plan_end_time: '20:00:00',
      remind_minutes_before: 1440,
    });
    const input = buildPlanInput(planToFormValues(source));
    expect(input).toEqual({
      title: 'Trip',
      location: 'Samarkand',
      notes: 'Bring the camera',
      plan_date: '2026-10-03',
      end_date: '2026-10-05',
      plan_time: '08:00:00',
      plan_end_time: '20:00:00',
      remind_minutes_before: 1440,
      remind_time: null,
    });
  });

  it('offers the work start time as the reminder time of an all-day plan', () => {
    expect(planToFormValues(plan(), '08:00:00').remindTime).toBe('08:00:00');
    expect(
      planToFormValues(plan({ remind_time: '10:00:00' }), '08:00:00')
        .remindTime,
    ).toBe('10:00:00');
  });

  it('round-trips an all-day plan with a reminder time', () => {
    const input = buildPlanInput(
      planToFormValues(plan({ remind_time: '10:00:00' })),
    );
    expect(input).toMatchObject({ plan_time: null, remind_time: '10:00:00' });
  });
});

describe('planFormatting', () => {
  it('formats a day as "Oct 3"', () => {
    expect(formatDayShort('2026-10-03')).toBe('Oct 3');
  });

  it('formats a date range only for multi-day plans', () => {
    expect(formatPlanDateRange(plan())).toBeNull();
    expect(
      formatPlanDateRange(
        plan({ plan_date: '2026-10-03', end_date: '2026-10-05' }),
      ),
    ).toBe('Oct 3 – Oct 5');
  });

  it('formats the time span', () => {
    expect(formatPlanTimeSpan(plan())).toBeNull();
    expect(formatPlanTimeSpan(plan({ plan_time: '14:00:00' }))).toBe('14:00');
    expect(
      formatPlanTimeSpan(
        plan({ plan_time: '14:00:00', plan_end_time: '19:00:00' }),
      ),
    ).toBe('14:00 – 19:00');
  });
});
