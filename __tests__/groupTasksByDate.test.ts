import { groupTasksByDate } from '../src/features/tasks/utils/groupTasksByDate.ts';
import type { Task } from '../src/types/task.types.ts';

// The real helper reads the clock and pulls in the Supabase client.
jest.mock('../src/services/task.service.ts', () => ({
  todayDateString: () => '2026-09-23',
}));

const task = (
  id: string,
  dueDate: string,
  time: string,
  isCompleted = false,
): Task => ({
  id,
  user_id: 'user',
  title: `Task ${id}`,
  scheduled_time: time,
  duration_minutes: 30,
  priority: null,
  is_completed: isCompleted,
  due_date: dueDate,
  attachment_path: null,
  started_at: null,
  goal_id: null,
  milestone_id: null,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
});

const keys = (tasks: Task[]) => groupTasksByDate(tasks).map(s => s.key);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 8, 23, 12, 0, 0));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('groupTasksByDate', () => {
  it('puts past unfinished tasks under Overdue', () => {
    const sections = groupTasksByDate([task('a', '2026-09-20', '09:00:00')]);
    expect(sections.map(s => s.key)).toEqual(['overdue']);
  });

  it('keeps past completed tasks in an Archive instead of dropping them', () => {
    const sections = groupTasksByDate([
      task('a', '2026-09-20', '09:00:00', true),
    ]);
    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({ key: 'archive', label: 'Archive' });
    expect(sections[0].data.map(t => t.id)).toEqual(['a']);
  });

  it('orders the Archive with the most recent tasks first', () => {
    const sections = groupTasksByDate([
      task('old', '2026-09-10', '09:00:00', true),
      task('yesterday-early', '2026-09-22', '08:00:00', true),
      task('yesterday-late', '2026-09-22', '18:00:00', true),
    ]);
    expect(sections[0].data.map(t => t.id)).toEqual([
      'yesterday-late',
      'yesterday-early',
      'old',
    ]);
  });

  it("keeps today's finished and missed tasks in Today", () => {
    const sections = groupTasksByDate([
      task('done', '2026-09-23', '08:00:00', true),
      task('missed', '2026-09-23', '09:00:00'),
    ]);
    expect(sections.map(s => s.key)).toEqual(['today']);
    expect(sections[0].data).toHaveLength(2);
  });

  it('places the Archive last, after Today, Tomorrow and later days', () => {
    expect(
      keys([
        task('archived', '2026-09-20', '09:00:00', true),
        task('later', '2026-09-30', '09:00:00'),
        task('tomorrow', '2026-09-24', '09:00:00'),
        task('today', '2026-09-23', '09:00:00'),
        task('overdue', '2026-09-21', '09:00:00'),
      ]),
    ).toEqual(['overdue', 'today', 'tomorrow', '2026-09-30', 'archive']);
  });

  it('returns no sections for no tasks', () => {
    expect(groupTasksByDate([])).toEqual([]);
  });
});
