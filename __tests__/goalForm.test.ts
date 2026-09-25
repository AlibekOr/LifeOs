import {
  buildGoalInput,
  defaultGoalFormValues,
  goalToFormValues,
  validateGoalForm,
} from '../src/features/goals/utils/goalForm.ts';
import type { Goal, GoalMilestone } from '../src/types/goal.types.ts';

const NOW = new Date(2026, 9, 4, 12, 0, 0);

const goal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'g1',
  user_id: 'user',
  title: 'Learn English',
  category: 'Learning',
  deadline: '2026-12-31',
  completed_at: null,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const milestone = (
  id: string,
  title: string,
  position: number,
): GoalMilestone => ({
  id,
  goal_id: 'g1',
  user_id: 'user',
  title,
  position,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
});

describe('defaultGoalFormValues', () => {
  it('starts empty, without a deadline, in the default category', () => {
    const values = defaultGoalFormValues(NOW);
    expect(values.title).toBe('');
    expect(values.category).toBe('Personal');
    expect(values.hasDeadline).toBe(false);
    expect(values.milestones).toEqual([]);
  });

  it('suggests a deadline 30 days ahead', () => {
    expect(defaultGoalFormValues(NOW).deadline).toBe('2026-11-03');
  });
});

describe('goalToFormValues', () => {
  it('loads the goal with its milestones in order', () => {
    const values = goalToFormValues(
      goal(),
      [milestone('b', 'Advanced', 1), milestone('a', 'Basics', 0)],
      NOW,
    );
    expect(values).toMatchObject({
      title: 'Learn English',
      category: 'Learning',
      hasDeadline: true,
      deadline: '2026-12-31',
    });
    expect(values.milestones).toEqual([
      { id: 'a', key: 'a', title: 'Basics' },
      { id: 'b', key: 'b', title: 'Advanced' },
    ]);
  });

  it('has no deadline switched on for a goal without one', () => {
    const values = goalToFormValues(goal({ deadline: null }), [], NOW);
    expect(values.hasDeadline).toBe(false);
  });
});

describe('validateGoalForm', () => {
  it('requires a title', () => {
    expect(validateGoalForm(defaultGoalFormValues(NOW)).title).toBeDefined();
    expect(
      validateGoalForm({ ...defaultGoalFormValues(NOW), title: '  ' }).title,
    ).toBeDefined();
    expect(
      validateGoalForm({ ...defaultGoalFormValues(NOW), title: 'Save' }),
    ).toEqual({});
  });
});

describe('buildGoalInput', () => {
  it('trims the title and sends the deadline only when switched on', () => {
    const base = {
      ...defaultGoalFormValues(NOW),
      title: '  Run a half marathon ',
      category: 'Health' as const,
    };
    expect(buildGoalInput(base)).toEqual({
      title: 'Run a half marathon',
      category: 'Health',
      deadline: null,
    });
    expect(
      buildGoalInput({ ...base, hasDeadline: true, deadline: '2026-10-31' })
        .deadline,
    ).toBe('2026-10-31');
  });
});
