import type { GoalCategory } from '../../../types/goal.types.ts';

export const GOAL_CATEGORIES: GoalCategory[] = [
  'Career',
  'Learning',
  'Health',
  'Finance',
  'Personal',
];

export const DEFAULT_GOAL_CATEGORY: GoalCategory = 'Personal';

// "Career Goal", as the badge in the design reads.
export function categoryBadgeLabel(category: GoalCategory): string {
  return `${category} Goal`;
}
