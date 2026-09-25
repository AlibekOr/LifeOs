import type {
  CreateGoalInput,
  Goal,
  GoalCategory,
  GoalMilestone,
} from '../../../types/goal.types.ts';
import { addDays, toDateString } from '../../plans/utils/planDates.ts';
import { DEFAULT_GOAL_CATEGORY } from './goalCategories.ts';
import type { EditableMilestone } from './milestoneChanges.ts';

export const TITLE_MAX_LENGTH = 120;
export const MAX_MILESTONES = 20;
const DEFAULT_DEADLINE_DAYS = 30;

export type GoalFormValues = {
  title: string;
  category: GoalCategory;
  hasDeadline: boolean;
  // "YYYY-MM-DD"
  deadline: string;
  milestones: EditableMilestone[];
};

export type GoalFormErrors = {
  title?: string;
};

export function defaultGoalFormValues(now: Date): GoalFormValues {
  return {
    title: '',
    category: DEFAULT_GOAL_CATEGORY,
    hasDeadline: false,
    deadline: addDays(toDateString(now), DEFAULT_DEADLINE_DAYS),
    milestones: [],
  };
}

export function goalToFormValues(
  goal: Goal,
  milestones: readonly GoalMilestone[],
  now: Date,
): GoalFormValues {
  return {
    title: goal.title,
    category: goal.category,
    hasDeadline: goal.deadline !== null,
    deadline:
      goal.deadline ?? addDays(toDateString(now), DEFAULT_DEADLINE_DAYS),
    milestones: [...milestones]
      .sort((a, b) => a.position - b.position)
      .map(milestone => ({
        id: milestone.id,
        key: milestone.id,
        title: milestone.title,
      })),
  };
}

export function validateGoalForm(values: GoalFormValues): GoalFormErrors {
  const errors: GoalFormErrors = {};
  if (values.title.trim().length === 0) {
    errors.title = 'Please enter a title.';
  }
  return errors;
}

export function buildGoalInput(values: GoalFormValues): CreateGoalInput {
  return {
    title: values.title.trim(),
    category: values.category,
    deadline: values.hasDeadline ? values.deadline : null,
  };
}
