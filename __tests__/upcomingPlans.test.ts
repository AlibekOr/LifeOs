import { selectUpcomingPlans } from '../src/features/plans/utils/upcomingPlans.ts';
import type { Plan } from '../src/types/plan.types.ts';

// Sunday, Oct 4 2026, 15:00.
const NOW = new Date(2026, 9, 4, 15, 0, 0);

const plan = (id: string, overrides: Partial<Plan> = {}): Plan => ({
  id,
  user_id: 'user',
  title: `Plan ${id}`,
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

const ids = (plans: Plan[], limit?: number) =>
  selectUpcomingPlans(plans, NOW, limit).map(entry => entry.plan.id);

describe('selectUpcomingPlans', () => {
  it('returns nothing without plans', () => {
    expect(selectUpcomingPlans([], NOW)).toEqual([]);
  });

  it("lists today's plans first, then later days in order", () => {
    const plans = [
      plan('later', { plan_date: '2026-10-10' }),
      plan('tomorrow', { plan_date: '2026-10-05' }),
      plan('today'),
    ];
    expect(ids(plans)).toEqual(['today', 'tomorrow', 'later']);
  });

  it('keeps at most three plans', () => {
    const plans = [
      plan('a'),
      plan('b', { plan_date: '2026-10-05' }),
      plan('c', { plan_date: '2026-10-06' }),
      plan('d', { plan_date: '2026-10-07' }),
    ];
    expect(ids(plans)).toEqual(['a', 'b', 'c']);
    expect(ids(plans, 2)).toEqual(['a', 'b']);
  });

  it('leaves out done, cancelled and past plans', () => {
    const plans = [
      plan('done', { status: 'done' }),
      plan('cancelled', { status: 'cancelled' }),
      plan('past', { plan_date: '2026-10-01' }),
      plan('open', { plan_date: '2026-10-05' }),
    ];
    expect(ids(plans)).toEqual(['open']);
  });

  it("drops today's plans whose end time has passed", () => {
    const plans = [
      plan('over', { plan_time: '09:00:00', plan_end_time: '10:00:00' }),
      plan('endsNow', { plan_time: '14:00:00', plan_end_time: '15:00:00' }),
      plan('running', { plan_time: '14:00:00', plan_end_time: '19:00:00' }),
      plan('noEnd', { plan_time: '09:00:00' }),
    ];
    expect(ids(plans)).toEqual(['noEnd', 'running']);
  });

  it('keeps a running multi-day plan and labels later days', () => {
    const entries = selectUpcomingPlans(
      [
        plan('trip', { plan_date: '2026-10-03', end_date: '2026-10-06' }),
        plan('dentist', { plan_date: '2026-10-10' }),
        plan('tomorrow', { plan_date: '2026-10-05' }),
      ],
      NOW,
    );
    expect(entries.map(entry => entry.plan.id)).toEqual([
      'trip',
      'tomorrow',
      'dentist',
    ]);
    expect(entries.map(entry => entry.dayLabel)).toEqual([
      null,
      'Tomorrow',
      'Sat, Oct 10',
    ]);
    expect(entries[0].progress).toEqual({ day: 2, total: 4 });
  });

  it('keeps a multi-day plan that ends today until its end time', () => {
    const trip = plan('trip', {
      plan_date: '2026-10-02',
      end_date: '2026-10-04',
      plan_time: '08:00:00',
      plan_end_time: '20:00:00',
    });
    expect(ids([trip])).toEqual(['trip']);
    expect(selectUpcomingPlans([trip], new Date(2026, 9, 4, 21, 0))).toEqual(
      [],
    );
  });
});
