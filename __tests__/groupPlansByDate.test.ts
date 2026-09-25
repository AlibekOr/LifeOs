import { groupPlansByDate } from '../src/features/plans/utils/groupPlansByDate.ts';
import type { Plan } from '../src/types/plan.types.ts';

// Sunday, Oct 4 2026.
const NOW = new Date(2026, 9, 4, 12, 0, 0);

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
  created_at: `2026-10-01T00:00:0${id.length}.000Z`,
  updated_at: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

const keys = (plans: Plan[]) =>
  groupPlansByDate(plans, NOW).map(section => section.key);

const ids = (plans: Plan[], key: string) =>
  groupPlansByDate(plans, NOW)
    .find(section => section.key === key)
    ?.data.map(entry => entry.plan.id);

describe('groupPlansByDate', () => {
  it('returns no sections without plans', () => {
    expect(groupPlansByDate([], NOW)).toEqual([]);
  });

  it('orders Today, Tomorrow, later dates and Past', () => {
    const sections = groupPlansByDate(
      [
        plan('past', { plan_date: '2026-10-01' }),
        plan('later', { plan_date: '2026-10-10' }),
        plan('tomorrow', { plan_date: '2026-10-05' }),
        plan('today'),
      ],
      NOW,
    );
    expect(sections.map(s => s.key)).toEqual([
      'today',
      'tomorrow',
      '2026-10-10',
      'past',
    ]);
    expect(sections.map(s => s.label)).toEqual([
      'Today',
      'Tomorrow',
      'Sat, Oct 10',
      'Past',
    ]);
  });

  it('sorts a day: carried-over first, then timed, then all-day', () => {
    const plans = [
      plan('allDay'),
      plan('late', { plan_time: '18:00:00' }),
      plan('early', { plan_time: '09:00:00' }),
      plan('trip', { plan_date: '2026-10-02', end_date: '2026-10-06' }),
    ];
    expect(ids(plans, 'today')).toEqual(['trip', 'early', 'late', 'allDay']);
  });

  it('shows a running multi-day plan under Today with its day count', () => {
    const [today] = groupPlansByDate(
      [plan('trip', { plan_date: '2026-10-03', end_date: '2026-10-05' })],
      NOW,
    );
    expect(today.key).toBe('today');
    expect(today.data[0].progress).toEqual({ day: 2, total: 3 });
  });

  it('counts a multi-day plan that crosses months', () => {
    const [today] = groupPlansByDate(
      [plan('trip', { plan_date: '2026-09-29', end_date: '2026-10-05' })],
      NOW,
    );
    expect(today.data[0].progress).toEqual({ day: 6, total: 7 });
  });

  it('keeps a plan that ends today out of Past', () => {
    const plans = [
      plan('trip', { plan_date: '2026-10-02', end_date: '2026-10-04' }),
    ];
    expect(keys(plans)).toEqual(['today']);
    expect(groupPlansByDate(plans, NOW)[0].data[0].progress).toEqual({
      day: 3,
      total: 3,
    });
  });

  it('moves a multi-day plan to Past only after its last day', () => {
    expect(
      keys([plan('trip', { plan_date: '2026-10-01', end_date: '2026-10-03' })]),
    ).toEqual(['past']);
  });

  it('lists a future multi-day plan only on its start date', () => {
    const sections = groupPlansByDate(
      [plan('trip', { plan_date: '2026-10-08', end_date: '2026-10-10' })],
      NOW,
    );
    expect(sections.map(s => s.key)).toEqual(['2026-10-08']);
    expect(sections[0].data[0].progress).toBeNull();
  });

  it('starts a multi-day plan on Day 1 when it begins today', () => {
    const [today] = groupPlansByDate(
      [plan('trip', { end_date: '2026-10-06' })],
      NOW,
    );
    expect(today.data[0].progress).toEqual({ day: 1, total: 3 });
  });

  it('puts done and cancelled past plans in Past, most recent first', () => {
    const plans = [
      plan('old', { plan_date: '2026-09-20', status: 'done' }),
      plan('recent', { plan_date: '2026-10-02', status: 'cancelled' }),
      plan('missed', { plan_date: '2026-10-01' }),
    ];
    expect(ids(plans, 'past')).toEqual(['recent', 'missed', 'old']);
  });

  it('leaves single-day plans without progress', () => {
    const [today] = groupPlansByDate([plan('gym')], NOW);
    expect(today.data[0].progress).toBeNull();
  });
});
