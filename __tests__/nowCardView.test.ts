import { getNowCardView } from '../src/features/main/utils/nowCardView.ts';

type TestTask = {
  id: string;
  is_completed: boolean;
  due_date: string;
  scheduled_time: string;
  duration_minutes: number;
  started_at: string | null;
};

const task = (
  id: string,
  time: string,
  overrides: Partial<TestTask> = {},
): TestTask => ({
  id,
  is_completed: false,
  due_date: '2026-09-23',
  scheduled_time: time,
  duration_minutes: 30,
  started_at: null,
  ...overrides,
});

const now = new Date(2026, 8, 23, 12, 0, 0);
const iso = (date: Date) => date.toISOString();
const at = (hours: number, minutes: number, day = 23) =>
  new Date(2026, 8, day, hours, minutes, 0);

describe('getNowCardView', () => {
  it('is hidden when there are no tasks', () => {
    expect(getNowCardView([], now)).toEqual({ kind: 'hidden' });
  });

  it('is hidden when the only tasks are on other days', () => {
    const view = getNowCardView(
      [task('a', '13:00:00', { due_date: '2026-09-24' })],
      now,
    );
    expect(view.kind).toBe('hidden');
  });

  it('shows a started task with time left as current', () => {
    const view = getNowCardView(
      [task('a', '09:00:00', { started_at: iso(at(11, 50)) })],
      now,
    );
    expect(view.kind).toBe('current');
    if (view.kind === 'current') {
      expect(view.task.id).toBe('a');
      expect(view.info.status).toBe('in-progress');
    }
  });

  it("keeps a started task whose time ran out as current (Time's up)", () => {
    const view = getNowCardView(
      [task('a', '09:00:00', { started_at: iso(at(11, 0)) })],
      now,
    );
    expect(view.kind).toBe('current');
    if (view.kind === 'current') {
      expect(view.info.status).toBe('overdue');
    }
  });

  it('prefers the current task over the next one', () => {
    const view = getNowCardView(
      [
        task('next', '13:00:00'),
        task('running', '11:00:00', { started_at: iso(at(11, 50)) }),
      ],
      now,
    );
    expect(view.kind).toBe('current');
  });

  it('shows the nearest upcoming task as next, with time until it starts', () => {
    const view = getNowCardView(
      [task('later', '15:00:00'), task('soon', '12:45:00')],
      now,
    );
    expect(view.kind).toBe('next');
    if (view.kind === 'next') {
      expect(view.task.id).toBe('soon');
      expect(view.info.status).toBe('upcoming');
    }
  });

  it('shows a task waiting for Start as next', () => {
    const view = getNowCardView([task('due', '11:57:00')], now);
    expect(view.kind).toBe('next');
    if (view.kind === 'next') {
      expect(view.info.status).toBe('awaiting-start');
    }
  });

  it('says all done when every task today is completed', () => {
    const view = getNowCardView(
      [
        task('a', '09:00:00', { is_completed: true }),
        task('b', '10:00:00', { is_completed: true }),
      ],
      now,
    );
    expect(view.kind).toBe('all-done');
  });

  it('is hidden when the rest of today was missed, not completed', () => {
    const view = getNowCardView(
      [
        task('done', '08:00:00', { is_completed: true }),
        task('missed', '09:00:00'),
      ],
      now,
    );
    expect(view.kind).toBe('hidden');
  });

  it('still shows next when some tasks are done and one is coming up', () => {
    const view = getNowCardView(
      [
        task('done', '08:00:00', { is_completed: true }),
        task('coming', '14:00:00'),
      ],
      now,
    );
    expect(view.kind).toBe('next');
  });

  it('keeps a task started yesterday that is still running past midnight', () => {
    const afterMidnight = at(0, 30);
    const view = getNowCardView(
      [
        task('late', '23:30:00', {
          due_date: '2026-09-22',
          duration_minutes: 120,
          started_at: iso(at(23, 30, 22)),
        }),
      ],
      afterMidnight,
    );
    expect(view.kind).toBe('current');
  });

  it('drops an old started task that ran out before today began', () => {
    const view = getNowCardView(
      [
        task('stale', '09:00:00', {
          due_date: '2026-09-20',
          started_at: iso(at(9, 0, 20)),
        }),
      ],
      now,
    );
    expect(view.kind).toBe('hidden');
  });
});
