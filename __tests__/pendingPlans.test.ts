import {
  buildLocalPlan,
  mergePendingPlans,
  planOverlapsRange,
} from '../src/features/plans/utils/pendingPlans.ts';
import type { PendingEntry } from '../src/types/pendingSync.types.ts';
import type { Plan } from '../src/types/plan.types.ts';

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

const meta = {
  userId: 'user',
  status: 'pending' as const,
  attempts: 0,
  lastError: null,
  revision: 0,
  queuedAt: '2026-10-04T08:00:00.000Z',
};

const RANGE = { from: '2026-10-01', to: '2026-10-31' };

describe('planOverlapsRange', () => {
  it('includes single-day plans inside the range only', () => {
    expect(planOverlapsRange(plan('a'), RANGE)).toBe(true);
    expect(
      planOverlapsRange(plan('a', { plan_date: '2026-09-30' }), RANGE),
    ).toBe(false);
    expect(
      planOverlapsRange(plan('a', { plan_date: '2026-11-01' }), RANGE),
    ).toBe(false);
  });

  it('includes multi-day plans that start before or end after the range', () => {
    const startsBefore = plan('a', {
      plan_date: '2026-09-29',
      end_date: '2026-10-02',
    });
    const endsAfter = plan('b', {
      plan_date: '2026-10-30',
      end_date: '2026-11-03',
    });
    expect(planOverlapsRange(startsBefore, RANGE)).toBe(true);
    expect(planOverlapsRange(endsAfter, RANGE)).toBe(true);
  });
});

describe('mergePendingPlans', () => {
  it('marks server plans as synced', () => {
    const [merged] = mergePendingPlans([plan('a')], []);
    expect(merged.syncStatus).toBe('synced');
  });

  it('overlays a queued update onto its server plan', () => {
    const entries: PendingEntry[] = [
      {
        ...meta,
        entity: 'plan',
        operation: 'update',
        id: 'a',
        payload: { title: 'Renamed', status: 'done' },
      },
    ];
    const [merged] = mergePendingPlans([plan('a')], entries);
    expect(merged).toMatchObject({
      title: 'Renamed',
      status: 'done',
      syncStatus: 'pending',
    });
  });

  it('adds a queued create that the server does not know yet', () => {
    const entries: PendingEntry[] = [
      {
        ...meta,
        entity: 'plan',
        operation: 'create',
        id: 'new',
        payload: { title: 'Dentist', plan_date: '2026-10-06' },
      },
    ];
    const merged = mergePendingPlans([], entries, RANGE);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      id: 'new',
      title: 'Dentist',
      status: 'planned',
      syncStatus: 'pending',
    });
  });

  it('does not duplicate a create the server already returned', () => {
    const entries: PendingEntry[] = [
      {
        ...meta,
        entity: 'plan',
        operation: 'create',
        id: 'a',
        payload: { title: 'Plan a', plan_date: '2026-10-04' },
      },
    ];
    expect(mergePendingPlans([plan('a')], entries)).toHaveLength(1);
  });

  it('ignores queued entries of other entities', () => {
    const entries: PendingEntry[] = [
      {
        ...meta,
        entity: 'task',
        operation: 'update',
        id: 'a',
        payload: { title: 'Task title' },
      },
    ];
    const [merged] = mergePendingPlans([plan('a')], entries);
    expect(merged.title).toBe('Plan a');
    expect(merged.syncStatus).toBe('synced');
  });

  it('drops plans an edit moved outside the range', () => {
    const entries: PendingEntry[] = [
      {
        ...meta,
        entity: 'plan',
        operation: 'update',
        id: 'a',
        payload: { plan_date: '2026-12-01' },
      },
    ];
    expect(mergePendingPlans([plan('a')], entries, RANGE)).toEqual([]);
  });

  it('sorts by date, then time, with all-day plans last', () => {
    const merged = mergePendingPlans(
      [
        plan('allDay'),
        plan('late', { plan_time: '18:00:00' }),
        plan('early', { plan_time: '09:00:00' }),
        plan('next', { plan_date: '2026-10-05', plan_time: '08:00:00' }),
      ],
      [],
    );
    expect(merged.map(item => item.id)).toEqual([
      'early',
      'late',
      'allDay',
      'next',
    ]);
  });
});

describe('buildLocalPlan', () => {
  it('fills defaults for a plan created offline', () => {
    const local = buildLocalPlan({
      ...meta,
      entity: 'plan',
      operation: 'create',
      id: 'new',
      payload: { title: 'Trip', plan_date: '2026-10-08' },
    });
    expect(local).toMatchObject({
      id: 'new',
      user_id: 'user',
      location: null,
      end_date: null,
      plan_time: null,
      plan_end_time: null,
      status: 'planned',
    });
  });
});
