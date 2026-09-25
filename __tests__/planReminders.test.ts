import {
  MAX_SCHEDULED_PLAN_REMINDERS,
  buildPlanAlert,
  getPlanReminderTime,
  planAlertId,
  selectPlanAlertsToSchedule,
  type ReminderPlan,
} from '../src/features/plans/utils/planReminders.ts';

// Sunday, Oct 4 2026, 12:00 local time.
const NOW = new Date(2026, 9, 4, 12, 0, 0);

const plan = (overrides: Partial<ReminderPlan> = {}): ReminderPlan => ({
  id: 'abc',
  title: 'Gym',
  location: null,
  status: 'planned',
  plan_date: '2026-10-04',
  plan_time: '18:00:00',
  remind_minutes_before: 60,
  remind_time: null,
  ...overrides,
});

describe('getPlanReminderTime', () => {
  it('counts back from the start of a timed plan', () => {
    const at = getPlanReminderTime(plan());
    expect(at).toEqual(new Date(2026, 9, 4, 17, 0, 0));
  });

  it('uses local time, not UTC', () => {
    const at = getPlanReminderTime(plan({ remind_minutes_before: 0 }));
    expect(at?.getHours()).toBe(18);
    expect(at?.getDate()).toBe(4);
  });

  it('can cross into the previous day', () => {
    const at = getPlanReminderTime(
      plan({ plan_time: '08:00:00', remind_minutes_before: 24 * 60 }),
    );
    expect(at).toEqual(new Date(2026, 9, 3, 8, 0, 0));
  });

  it('uses the chosen time of day for an all-day plan', () => {
    const at = getPlanReminderTime(
      plan({
        plan_time: null,
        remind_minutes_before: null,
        remind_time: '08:30:00',
      }),
    );
    expect(at).toEqual(new Date(2026, 9, 4, 8, 30, 0));
  });

  it('is null without a reminder', () => {
    expect(
      getPlanReminderTime(plan({ remind_minutes_before: null })),
    ).toBeNull();
    expect(
      getPlanReminderTime(
        plan({ plan_time: null, remind_minutes_before: null }),
      ),
    ).toBeNull();
  });

  it('is null for done and cancelled plans', () => {
    expect(getPlanReminderTime(plan({ status: 'done' }))).toBeNull();
    expect(getPlanReminderTime(plan({ status: 'cancelled' }))).toBeNull();
  });
});

describe('buildPlanAlert', () => {
  it('builds a "Plan: <title>" alert with the start time and location', () => {
    const alert = buildPlanAlert(
      plan({ location: 'Fitness Club, Nukus' }),
      NOW,
    );
    expect(alert).toEqual({
      id: 'plan-abc',
      planId: 'abc',
      at: new Date(2026, 9, 4, 17, 0, 0),
      title: 'Plan: Gym',
      body: 'Starts at 18:00 · Fitness Club, Nukus',
    });
  });

  it('has no body for an all-day plan without a location', () => {
    const alert = buildPlanAlert(
      plan({
        plan_time: null,
        remind_minutes_before: null,
        remind_time: '15:00:00',
      }),
      NOW,
    );
    expect(alert?.body).toBeUndefined();
  });

  it('skips a reminder time that has already passed', () => {
    expect(
      buildPlanAlert(
        plan({ remind_minutes_before: 15 }),
        new Date(2026, 9, 4, 17, 50),
      ),
    ).toBeNull();
    // Even though the plan itself has not started yet.
    expect(
      buildPlanAlert(
        plan({ remind_minutes_before: 120 }),
        new Date(2026, 9, 4, 17, 0),
      ),
    ).toBeNull();
  });

  it('skips a reminder that is due right now', () => {
    expect(
      buildPlanAlert(
        plan({ remind_minutes_before: 0 }),
        new Date(2026, 9, 4, 18, 0),
      ),
    ).toBeNull();
  });

  it('skips plans beyond the horizon', () => {
    expect(buildPlanAlert(plan({ plan_date: '2026-11-20' }), NOW)).toBeNull();
    expect(
      buildPlanAlert(plan({ plan_date: '2026-10-30' }), NOW),
    ).not.toBeNull();
  });

  it('reminds a multi-day plan only before its start', () => {
    // The end date is not part of the reminder input at all.
    const alert = buildPlanAlert(plan({ plan_date: '2026-10-06' }), NOW);
    expect(alert?.at).toEqual(new Date(2026, 9, 6, 17, 0, 0));
  });
});

describe('planAlertId', () => {
  it('is stable so a reschedule replaces the old alert', () => {
    expect(planAlertId('abc')).toBe('plan-abc');
    expect(planAlertId('abc')).toBe(planAlertId('abc'));
  });
});

describe('selectPlanAlertsToSchedule', () => {
  it('returns the soonest alerts first and drops plans without one', () => {
    const alerts = selectPlanAlertsToSchedule(
      [
        plan({ id: 'late', plan_date: '2026-10-08' }),
        plan({ id: 'none', remind_minutes_before: null }),
        plan({ id: 'soon' }),
        plan({ id: 'done', status: 'done' }),
      ],
      NOW,
    );
    expect(alerts.map(alert => alert.planId)).toEqual(['soon', 'late']);
  });

  it('caps the number of alerts', () => {
    const plans = Array.from(
      { length: MAX_SCHEDULED_PLAN_REMINDERS + 5 },
      (_, i) => plan({ id: `p${i}`, plan_date: '2026-10-05' }),
    );
    expect(selectPlanAlertsToSchedule(plans, NOW)).toHaveLength(
      MAX_SCHEDULED_PLAN_REMINDERS,
    );
  });
});
