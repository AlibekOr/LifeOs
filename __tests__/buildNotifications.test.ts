import {
  MAX_OVERDUE_NOTIFICATIONS,
  buildNotifications,
} from '../src/features/notifications/utils/buildNotifications.ts';
import type { BuildNotificationsInput } from '../src/features/notifications/utils/buildNotifications.ts';

type TestTask = BuildNotificationsInput['tasks'][number];

const now = new Date(2026, 8, 23, 12, 0, 0);
const NONE = { tasks: 0, transactions: 0 };

const task = (
  id: string,
  time: string,
  overrides: Partial<TestTask> = {},
): TestTask => ({
  id,
  title: `Task ${id}`,
  due_date: '2026-09-23',
  scheduled_time: time,
  duration_minutes: 30,
  is_completed: false,
  started_at: null,
  ...overrides,
});

const build = (input: Partial<BuildNotificationsInput> = {}) =>
  buildNotifications({
    tasks: [],
    now,
    insight: null,
    previousMonthName: 'August',
    failedSync: NONE,
    ...input,
  });

const ids = (input: Partial<BuildNotificationsInput>) =>
  build(input).map(item => item.id);

describe('buildNotifications: overdue', () => {
  it('flags an unfinished task whose start has passed', () => {
    expect(ids({ tasks: [task('a', '09:00:00')] })).toEqual(['overdue:a']);
  });

  it('ignores completed tasks', () => {
    expect(
      ids({ tasks: [task('a', '09:00:00', { is_completed: true })] }),
    ).toEqual([]);
  });

  it('does not flag a task still inside the 5 minute start window', () => {
    expect(ids({ tasks: [task('a', '11:56:00')] })).not.toContain('overdue:a');
  });

  it('does not flag a started task that is still counting down', () => {
    const startedAt = new Date(2026, 8, 23, 11, 50, 0).toISOString();
    expect(
      ids({ tasks: [task('a', '09:00:00', { started_at: startedAt })] }),
    ).not.toContain('overdue:a');
  });

  it('flags a started task whose time ran out', () => {
    const startedAt = new Date(2026, 8, 23, 11, 0, 0).toISOString();
    expect(
      ids({ tasks: [task('a', '09:00:00', { started_at: startedAt })] }),
    ).toEqual(['overdue:a']);
  });

  it('ignores tasks older than the lookback window', () => {
    expect(
      ids({ tasks: [task('old', '09:00:00', { due_date: '2026-09-10' })] }),
    ).toEqual([]);
  });

  it('caps the list and adds one summary for the rest', () => {
    const many = Array.from({ length: MAX_OVERDUE_NOTIFICATIONS + 2 }, (_, i) =>
      task(`t${i}`, `0${i + 1}:00:00`),
    );
    const result = build({ tasks: many });
    expect(result).toHaveLength(MAX_OVERDUE_NOTIFICATIONS + 1);
    expect(result[result.length - 1].id).toBe('overdue:more:2');
  });
});

describe('buildNotifications: upcoming', () => {
  it('includes a task starting within two hours', () => {
    expect(ids({ tasks: [task('a', '13:30:00')] })).toEqual(['upcoming:a']);
  });

  it('includes a task starting exactly at the two hour limit', () => {
    expect(ids({ tasks: [task('a', '14:00:00')] })).toEqual(['upcoming:a']);
  });

  it('excludes a task starting after the window', () => {
    expect(ids({ tasks: [task('a', '14:01:00')] })).toEqual([]);
  });

  it('treats a task starting exactly now as upcoming, not overdue', () => {
    expect(ids({ tasks: [task('a', '12:00:00')] })).toEqual(['upcoming:a']);
  });

  it('words the start time relative to now', () => {
    const [item] = build({ tasks: [task('a', '12:45:00')] });
    expect(item.title).toBe('Task a starts in 45 min');
    const [later] = build({ tasks: [task('b', '13:30:00')] });
    expect(later.title).toBe('Task b starts in 1h 30m');
  });
});

describe('buildNotifications: milestone', () => {
  const done = (count: number) =>
    Array.from({ length: count }, (_, i) =>
      task(`d${i}`, '08:00:00', { is_completed: true }),
    );

  it('needs at least three completed tasks today', () => {
    expect(ids({ tasks: done(2) })).toEqual([]);
    expect(ids({ tasks: done(3) })).toEqual(['milestone:2026-09-23:3']);
  });

  it('moves to a new id at the next tier so it reads as new', () => {
    expect(ids({ tasks: done(5) })).toEqual(['milestone:2026-09-23:5']);
    expect(ids({ tasks: done(9) })).toEqual(['milestone:2026-09-23:5']);
    expect(ids({ tasks: done(10) })).toEqual(['milestone:2026-09-23:10']);
  });
});

describe('buildNotifications: spending and sync', () => {
  it('warns when a category is up', () => {
    const [item] = build({
      insight: { category: 'Food', percentChange: 18, direction: 'more' },
    });
    expect(item.title).toBe('Food spending is up 18%');
    expect(item.tone).toBe('warning');
    expect(item.target).toEqual({ type: 'finance' });
  });

  it('celebrates when a category is down', () => {
    const [item] = build({
      insight: { category: 'Food', percentChange: 12, direction: 'less' },
    });
    expect(item.tone).toBe('success');
  });

  it('reports failed syncs and targets the right screen', () => {
    const [tasks] = build({ failedSync: { tasks: 1, transactions: 1 } });
    expect(tasks.title).toBe("2 changes couldn't be synced");
    expect(tasks.target).toEqual({ type: 'tasks' });
    const [finance] = build({ failedSync: { tasks: 0, transactions: 1 } });
    expect(finance.target).toEqual({ type: 'finance' });
  });
});

describe('buildNotifications: ordering', () => {
  it('lists attention first, then upcoming, then insights', () => {
    const result = build({
      tasks: [
        task('soon', '12:30:00'),
        task('missed', '09:00:00'),
        ...Array.from({ length: 3 }, (_, i) =>
          task(`d${i}`, '08:00:00', { is_completed: true }),
        ),
      ],
      failedSync: { tasks: 1, transactions: 0 },
    });
    expect(result.map(item => item.group)).toEqual([
      'attention',
      'attention',
      'upcoming',
      'insights',
    ]);
  });

  it('returns nothing when there is nothing to say', () => {
    expect(build()).toEqual([]);
  });
});
