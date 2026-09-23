import {
  isTaskOverdue,
  sortTasksCompletedLast,
} from '../src/features/tasks/utils/taskStatus.ts';

type TestTask = {
  id: string;
  is_completed: boolean;
  due_date: string;
  scheduled_time: string;
};

const task = (
  id: string,
  time: string,
  is_completed = false,
  due_date = '2026-09-23',
): TestTask => ({ id, is_completed, due_date, scheduled_time: time });

const now = new Date(2026, 8, 23, 12, 0, 0);

describe('isTaskOverdue', () => {
  it('is overdue when incomplete and started before now', () => {
    expect(isTaskOverdue(task('a', '11:59:00'), now)).toBe(true);
  });

  it('is not overdue when it starts exactly now', () => {
    expect(isTaskOverdue(task('a', '12:00:00'), now)).toBe(false);
  });

  it('is not overdue when it starts later today', () => {
    expect(isTaskOverdue(task('a', '12:01:00'), now)).toBe(false);
  });

  it('is never overdue when completed', () => {
    expect(isTaskOverdue(task('a', '08:00:00', true), now)).toBe(false);
  });

  it('is overdue when incomplete on a past date, whatever the time', () => {
    expect(isTaskOverdue(task('a', '23:59:00', false, '2026-09-22'), now)).toBe(
      true,
    );
  });

  it('is not overdue on a future date', () => {
    expect(isTaskOverdue(task('a', '00:00:00', false, '2026-09-24'), now)).toBe(
      false,
    );
  });

  it('accepts HH:mm without seconds', () => {
    expect(isTaskOverdue(task('a', '11:00'), now)).toBe(true);
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
