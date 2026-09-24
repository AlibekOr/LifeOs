import {
  getCurrentTask,
  getNextTask,
  getTaskTimeInfo,
  isTaskActive,
  sortTasksCompletedLast,
} from '../src/features/tasks/utils/taskStatus.ts';

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
  is_completed = false,
  due_date = '2026-09-23',
  started_at: string | null = null,
  duration_minutes = 30,
): TestTask => ({
  id,
  is_completed,
  due_date,
  scheduled_time: time,
  duration_minutes,
  started_at,
});

const now = new Date(2026, 8, 23, 12, 0, 0);
const at = (hours: number, minutes: number, day = 23) =>
  new Date(2026, 8, day, hours, minutes, 0);
const iso = (date: Date) => date.toISOString();

describe('getTaskTimeInfo — not started', () => {
  it('is upcoming before the scheduled time, with the time left to start', () => {
    const info = getTaskTimeInfo(task('a', '12:01:00'), now);
    expect(info.status).toBe('upcoming');
    expect(info.remainingMs).toBe(60 * 1000);
  });

  it('is awaiting-start exactly at the scheduled time', () => {
    expect(getTaskTimeInfo(task('a', '12:00:00'), now).status).toBe(
      'awaiting-start',
    );
  });

  it('is still awaiting-start one millisecond before the grace period ends', () => {
    const justBefore = new Date(at(12, 5).getTime() - 1);
    expect(getTaskTimeInfo(task('a', '12:00:00'), justBefore).status).toBe(
      'awaiting-start',
    );
  });

  it('is missed exactly when the 5 minute grace period ends', () => {
    expect(getTaskTimeInfo(task('a', '12:00:00'), at(12, 5)).status).toBe(
      'missed',
    );
  });

  it('is missed on a past date, whatever the time', () => {
    expect(
      getTaskTimeInfo(task('a', '23:59:00', false, '2026-09-22'), now).status,
    ).toBe('missed');
  });

  it('is upcoming on a future date', () => {
    expect(
      getTaskTimeInfo(task('a', '00:00:00', false, '2026-09-24'), now).status,
    ).toBe('upcoming');
  });

  it('accepts HH:mm without seconds', () => {
    expect(getTaskTimeInfo(task('a', '11:00'), now).status).toBe('missed');
  });
});

describe('getTaskTimeInfo — started', () => {
  const started = (startedAt: Date, duration = 30) =>
    task('a', '09:00:00', false, '2026-09-23', iso(startedAt), duration);

  it('is in-progress at the moment it was started, with progress 0', () => {
    const info = getTaskTimeInfo(started(now), now);
    expect(info.status).toBe('in-progress');
    expect(info.progress).toBe(0);
    expect(info.remainingMs).toBe(30 * 60 * 1000);
    expect(info.end.getTime()).toBe(at(12, 30).getTime());
  });

  it('counts from when Start was pressed, not from the scheduled time', () => {
    // Scheduled 09:00, started 11:50: 20 of 30 minutes left at 12:00.
    const info = getTaskTimeInfo(started(at(11, 50)), now);
    expect(info.status).toBe('in-progress');
    expect(info.remainingMs).toBe(20 * 60 * 1000);
  });

  it('reports halfway progress', () => {
    const info = getTaskTimeInfo(started(at(11, 45)), now);
    expect(info.progress).toBeCloseTo(0.5);
  });

  it('is in-progress one millisecond before the end', () => {
    const justBefore = new Date(at(12, 30).getTime() - 1);
    expect(getTaskTimeInfo(started(now), justBefore).status).toBe(
      'in-progress',
    );
  });

  it('is overdue exactly at the end', () => {
    const info = getTaskTimeInfo(started(now), at(12, 30));
    expect(info.status).toBe('overdue');
    expect(info.remainingMs).toBe(0);
  });

  it('stays in-progress across midnight', () => {
    const startedLate = task(
      'a',
      '23:30:00',
      false,
      '2026-09-23',
      iso(at(23, 30)),
      90,
    );
    expect(getTaskTimeInfo(startedLate, at(0, 15, 24)).status).toBe(
      'in-progress',
    );
    expect(getTaskTimeInfo(startedLate, at(1, 0, 24)).status).toBe('overdue');
  });

  it('treats an unreadable started_at as not started', () => {
    const broken = task('a', '12:00:00', false, '2026-09-23', 'not-a-date');
    expect(getTaskTimeInfo(broken, now).status).toBe('awaiting-start');
  });
});

describe('getTaskTimeInfo — done and duration', () => {
  it('is done when completed, whatever the time', () => {
    expect(getTaskTimeInfo(task('a', '08:00:00', true), now).status).toBe(
      'done',
    );
  });

  it('is done when completed after being started and past its end', () => {
    const finished = task(
      'a',
      '09:00:00',
      true,
      '2026-09-23',
      iso(at(9, 0)),
      30,
    );
    expect(getTaskTimeInfo(finished, now).status).toBe('done');
  });

  it.each([0, -5, NaN])(
    'treats a duration of %s as the 1 minute minimum',
    duration => {
      const info = getTaskTimeInfo(
        task('a', '12:00:00', false, '2026-09-23', iso(now), duration),
        now,
      );
      expect(info.end.getTime() - info.start.getTime()).toBe(60 * 1000);
      expect(info.status).toBe('in-progress');
    },
  );
});

describe('getCurrentTask', () => {
  const started = (id: string, startedAt: Date, duration: number) =>
    task(id, '09:00:00', false, '2026-09-23', iso(startedAt), duration);

  it('returns null when nothing has been started', () => {
    expect(getCurrentTask([task('a', '12:00:00')], now)).toBeNull();
  });

  it('ignores completed tasks', () => {
    const done = task('a', '11:50:00', true, '2026-09-23', iso(at(11, 50)));
    expect(getCurrentTask([done], now)).toBeNull();
  });

  it('picks the overlapping task that ends first and counts the rest', () => {
    const result = getCurrentTask(
      [
        started('late-end', at(11, 30), 120),
        started('early-end', at(11, 40), 30),
        started('mid-end', at(11, 45), 60),
      ],
      now,
    );
    expect(result?.task.id).toBe('early-end');
    expect(result?.otherInProgressCount).toBe(2);
  });

  it('prefers a task still counting down over one whose time ran out', () => {
    const result = getCurrentTask(
      [started('time-up', at(10, 0), 30), started('running', at(11, 50), 60)],
      now,
    );
    expect(result?.task.id).toBe('running');
    expect(result?.otherInProgressCount).toBe(0);
  });

  it('falls back to a started task whose time ran out', () => {
    const result = getCurrentTask([started('time-up', at(10, 0), 30)], now);
    expect(result?.task.id).toBe('time-up');
    expect(result?.info.status).toBe('overdue');
  });
});

describe('getNextTask', () => {
  it('returns the nearest upcoming task today', () => {
    const result = getNextTask(
      [task('later', '15:00:00'), task('soon', '12:45:00')],
      now,
    );
    expect(result?.task.id).toBe('soon');
    expect(result?.info.remainingMs).toBe(45 * 60 * 1000);
  });

  it('includes a task waiting for the user to press Start', () => {
    const result = getNextTask([task('due', '11:57:00')], now);
    expect(result?.task.id).toBe('due');
    expect(result?.info.status).toBe('awaiting-start');
  });

  it('ignores other days, completed, missed and started tasks', () => {
    const result = getNextTask(
      [
        task('tomorrow', '13:00:00', false, '2026-09-24'),
        task('done', '13:00:00', true),
        task('missed', '10:00:00'),
        task('running', '11:00:00', false, '2026-09-23', iso(at(11, 50))),
      ],
      now,
    );
    expect(result).toBeNull();
  });
});

describe('isTaskActive', () => {
  it('is active before the scheduled time and while waiting for Start', () => {
    expect(isTaskActive(task('a', '13:00:00'), now)).toBe(true);
    expect(isTaskActive(task('a', '11:57:00'), now)).toBe(true);
  });

  it('is active while in progress', () => {
    const running = task('a', '09:00:00', false, '2026-09-23', iso(at(11, 50)));
    expect(isTaskActive(running, now)).toBe(true);
  });

  it('is not active once completed', () => {
    expect(isTaskActive(task('a', '13:00:00', true), now)).toBe(false);
  });

  it('is not active once missed', () => {
    expect(isTaskActive(task('a', '10:00:00'), now)).toBe(false);
  });

  it('is not active when the started time ran out', () => {
    const timedOut = task('a', '09:00:00', false, '2026-09-23', iso(at(11, 0)));
    expect(isTaskActive(timedOut, now)).toBe(false);
  });
});

describe('sortTasksCompletedLast', () => {
  it('puts incomplete tasks first by time, completed tasks last', () => {
    const sorted = sortTasksCompletedLast([
      task('done-early', '08:00:00', true),
      task('late', '18:00:00'),
      task('early', '09:00:00'),
      task('done-late', '20:00:00', true),
    ]);
    expect(sorted.map(item => item.id)).toEqual([
      'early',
      'late',
      'done-early',
      'done-late',
    ]);
  });

  it('orders by date before time', () => {
    const sorted = sortTasksCompletedLast([
      task('tomorrow', '08:00:00', false, '2026-09-24'),
      task('today', '20:00:00'),
    ]);
    expect(sorted.map(item => item.id)).toEqual(['today', 'tomorrow']);
  });

  it('does not mutate the input array', () => {
    const input = [task('b', '10:00:00'), task('a', '09:00:00')];
    sortTasksCompletedLast(input);
    expect(input.map(item => item.id)).toEqual(['b', 'a']);
  });

  it('returns an empty array for no tasks', () => {
    expect(sortTasksCompletedLast([])).toEqual([]);
  });
});
