import { findOverlappingPlan } from '../src/features/plans/utils/planOverlap.ts';
import type { Plan } from '../src/types/plan.types.ts';

const plan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'p',
  user_id: 'user',
  title: 'Plan',
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

// "Work" today from 14:00 to 19:00.
const work = plan({
  id: 'work',
  plan_time: '14:00:00',
  plan_end_time: '19:00:00',
});

const conflictWith = (candidate: Partial<Plan>, others: Plan[] = [work]) =>
  findOverlappingPlan(plan({ id: 'new', ...candidate }), others);

describe('findOverlappingPlan', () => {
  it('allows a plan that starts exactly when another ends', () => {
    expect(conflictWith({ plan_time: '19:00:00' })).toBeUndefined();
    expect(
      conflictWith({ plan_time: '19:00:00', plan_end_time: '20:00:00' }),
    ).toBeUndefined();
  });

  it('allows a plan that ends exactly when another starts', () => {
    expect(
      conflictWith({ plan_time: '13:00:00', plan_end_time: '14:00:00' }),
    ).toBeUndefined();
  });

  it('rejects a start moment inside another plan', () => {
    expect(conflictWith({ plan_time: '18:00:00' })).toBe(work);
    expect(conflictWith({ plan_time: '14:00:00' })).toBe(work);
  });

  it('rejects an interval that overlaps another one', () => {
    expect(
      conflictWith({ plan_time: '12:00:00', plan_end_time: '15:00:00' }),
    ).toBe(work);
    expect(
      conflictWith({ plan_time: '18:00:00', plan_end_time: '20:00:00' }),
    ).toBe(work);
    expect(
      conflictWith({ plan_time: '10:00:00', plan_end_time: '22:00:00' }),
    ).toBe(work);
  });

  it('rejects an interval that swallows a start moment', () => {
    const lunch = plan({ id: 'lunch', plan_time: '15:00:00' });
    expect(
      conflictWith({ plan_time: '14:00:00', plan_end_time: '16:00:00' }, [
        lunch,
      ]),
    ).toBe(lunch);
  });

  it('lets plans without an end time share a moment', () => {
    const gym = plan({ id: 'gym', plan_time: '18:00:00' });
    expect(conflictWith({ plan_time: '18:00:00' }, [gym])).toBeUndefined();
  });

  it('never conflicts for all-day plans', () => {
    expect(conflictWith({ plan_time: null })).toBeUndefined();
    const allDay = plan({ id: 'trip' });
    expect(
      conflictWith({ plan_time: '10:00:00', plan_end_time: '11:00:00' }, [
        allDay,
      ]),
    ).toBeUndefined();
  });

  it('ignores cancelled plans on either side', () => {
    const cancelledWork = plan({ ...work, status: 'cancelled' });
    expect(conflictWith({ plan_time: '18:00:00' }, [cancelledWork])).toBe(
      undefined,
    );
    expect(
      conflictWith({ plan_time: '18:00:00', status: 'cancelled' }),
    ).toBeUndefined();
  });

  it('ignores the plan being edited', () => {
    expect(
      findOverlappingPlan({ ...work, plan_end_time: '20:00:00' }, [work]),
    ).toBeUndefined();
  });

  it('only compares plans on overlapping days', () => {
    expect(
      conflictWith({ plan_date: '2026-10-05', plan_time: '18:00:00' }),
    ).toBeUndefined();
  });

  it('handles an overnight plan that ends the next day', () => {
    const night = plan({
      id: 'night',
      plan_time: '22:00:00',
      end_date: '2026-10-05',
      plan_end_time: '02:00:00',
    });
    expect(
      conflictWith({ plan_date: '2026-10-05', plan_time: '01:00:00' }, [night]),
    ).toBe(night);
    expect(
      conflictWith({ plan_date: '2026-10-05', plan_time: '02:00:00' }, [night]),
    ).toBeUndefined();
  });
});
