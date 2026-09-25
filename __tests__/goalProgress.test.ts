import {
  calcProgress,
  countCompletedMilestones,
  describeTimeRemaining,
  formatMonthYear,
  goalProgress,
  milestoneProgress,
  pickFeaturedGoal,
  splitGoals,
} from '../src/features/goals/utils/goalProgress.ts';
import type { Goal, GoalMilestone } from '../src/types/goal.types.ts';
import type { Task } from '../src/types/task.types.ts';

type LinkedTask = Pick<Task, 'is_completed' | 'goal_id' | 'milestone_id'>;

const task = (
  isCompleted: boolean,
  goalId: string | null,
  milestoneId: string | null = null,
): LinkedTask => ({
  is_completed: isCompleted,
  goal_id: goalId,
  milestone_id: milestoneId,
});

const goal = (id: string, overrides: Partial<Goal> = {}): Goal => ({
  id,
  user_id: 'user',
  title: `Goal ${id}`,
  category: 'Career',
  deadline: null,
  completed_at: null,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const milestone = (id: string, goalId = 'g1'): GoalMilestone => ({
  id,
  goal_id: goalId,
  user_id: 'user',
  title: `Milestone ${id}`,
  position: 0,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
});

describe('calcProgress', () => {
  it('is 0% with no tasks', () => {
    expect(calcProgress([])).toEqual({ completed: 0, total: 0, percent: 0 });
  });

  it('rounds the share of completed tasks', () => {
    const tasks = [task(true, 'g'), task(false, 'g'), task(false, 'g')];
    expect(calcProgress(tasks)).toEqual({
      completed: 1,
      total: 3,
      percent: 33,
    });
    expect(calcProgress([task(true, 'g'), task(true, 'g')]).percent).toBe(100);
  });
});

describe('goalProgress / milestoneProgress', () => {
  const tasks = [
    task(true, 'g1', 'm1'),
    task(false, 'g1', 'm1'),
    task(true, 'g1', null),
    task(true, 'g2', 'm2'),
    task(false, null),
  ];

  it('counts every task linked to the goal, milestone or not', () => {
    expect(goalProgress('g1', tasks)).toEqual({
      completed: 2,
      total: 3,
      percent: 67,
    });
  });

  it('counts only the tasks of one milestone', () => {
    expect(milestoneProgress('m1', tasks).percent).toBe(50);
    expect(milestoneProgress('m2', tasks).percent).toBe(100);
  });

  it('ignores tasks linked to nothing', () => {
    expect(goalProgress('unknown', tasks).total).toBe(0);
  });
});

describe('countCompletedMilestones', () => {
  it('needs tasks, all of them done', () => {
    const tasks = [
      task(true, 'g1', 'done'),
      task(true, 'g1', 'done'),
      task(true, 'g1', 'half'),
      task(false, 'g1', 'half'),
    ];
    const milestones = [
      milestone('done'),
      milestone('half'),
      milestone('empty'),
    ];
    expect(countCompletedMilestones(milestones, tasks)).toBe(1);
  });
});

describe('splitGoals', () => {
  it('orders active goals by deadline, without a deadline last', () => {
    const { active } = splitGoals([
      goal('none'),
      goal('late', { deadline: '2026-12-31' }),
      goal('soon', { deadline: '2026-10-31' }),
    ]);
    expect(active.map(g => g.id)).toEqual(['soon', 'late', 'none']);
  });

  it('puts completed goals apart, most recent first', () => {
    const { active, completed } = splitGoals([
      goal('old', { completed_at: '2026-01-10T00:00:00.000Z' }),
      goal('open'),
      goal('new', { completed_at: '2026-08-10T00:00:00.000Z' }),
    ]);
    expect(active.map(g => g.id)).toEqual(['open']);
    expect(completed.map(g => g.id)).toEqual(['new', 'old']);
  });
});

describe('pickFeaturedGoal', () => {
  it('picks the active goal closest to being finished', () => {
    const goals = [goal('a'), goal('b')];
    const tasks = [task(true, 'b'), task(false, 'a'), task(false, 'b')];
    expect(pickFeaturedGoal(goals, tasks)?.id).toBe('b');
  });

  it('falls back to the first goal when none has progress', () => {
    expect(pickFeaturedGoal([goal('a'), goal('b')], [])?.id).toBe('a');
  });

  it('returns nothing without goals', () => {
    expect(pickFeaturedGoal([], [])).toBeUndefined();
  });
});

describe('formatMonthYear', () => {
  it('formats a deadline and a completion timestamp', () => {
    expect(formatMonthYear('2025-12-31')).toBe('Dec 2025');
    expect(formatMonthYear('2024-12-05T10:00:00.000Z')).toBe('Dec 2024');
  });
});

describe('describeTimeRemaining', () => {
  const NOW = new Date(2026, 9, 4, 12, 0, 0);

  it('counts days for the next month', () => {
    expect(describeTimeRemaining('2026-10-05', NOW)).toBe('1 day remaining');
    expect(describeTimeRemaining('2026-10-16', NOW)).toBe('12 days remaining');
  });

  it('switches to months for longer spans', () => {
    expect(describeTimeRemaining('2027-02-04', NOW)).toBe('4 months remaining');
    expect(describeTimeRemaining('2026-11-15', NOW)).toBe('1 month remaining');
  });

  it('handles today and the past', () => {
    expect(describeTimeRemaining('2026-10-04', NOW)).toBe('Due today');
    expect(describeTimeRemaining('2026-10-03', NOW)).toBe('Overdue by 1 day');
    expect(describeTimeRemaining('2026-09-24', NOW)).toBe('Overdue by 10 days');
  });
});
