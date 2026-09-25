import type { Goal, GoalMilestone } from '../../../types/goal.types.ts';
import type { Task } from '../../../types/task.types.ts';
import { diffDays, toDateString } from '../../plans/utils/planDates.ts';

type LinkedTask = Pick<Task, 'is_completed' | 'goal_id' | 'milestone_id'>;

export type Progress = {
  completed: number;
  total: number;
  // Whole percent, 0 when nothing is linked yet.
  percent: number;
};

export function calcProgress(
  tasks: readonly Pick<Task, 'is_completed'>[],
): Progress {
  const total = tasks.length;
  const completed = tasks.filter(task => task.is_completed).length;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

// A goal's progress is the share of its linked tasks that are done, whether or
// not they belong to a milestone.
export function goalProgress(
  goalId: string,
  tasks: readonly LinkedTask[],
): Progress {
  return calcProgress(tasks.filter(task => task.goal_id === goalId));
}

export function milestoneProgress(
  milestoneId: string,
  tasks: readonly LinkedTask[],
): Progress {
  return calcProgress(tasks.filter(task => task.milestone_id === milestoneId));
}

// A milestone counts as completed once it has tasks and all of them are done.
export function countCompletedMilestones(
  milestones: readonly GoalMilestone[],
  tasks: readonly LinkedTask[],
): number {
  return milestones.filter(milestone => {
    const { total, percent } = milestoneProgress(milestone.id, tasks);
    return total > 0 && percent === 100;
  }).length;
}

function compareByDeadline(a: Goal, b: Goal): number {
  if (a.deadline !== b.deadline) {
    // Goals without a deadline go last.
    if (a.deadline === null) {
      return 1;
    }
    if (b.deadline === null) {
      return -1;
    }
    return a.deadline < b.deadline ? -1 : 1;
  }
  return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
}

// Active goals by nearest deadline; completed goals, most recently finished
// first.
export function splitGoals<T extends Goal>(
  goals: readonly T[],
): { active: T[]; completed: T[] } {
  const active = goals
    .filter(goal => goal.completed_at === null)
    .sort(compareByDeadline);
  const completed = goals
    .filter(goal => goal.completed_at !== null)
    .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''));
  return { active, completed };
}

// The goal shown in the large card: the active one closest to being finished
// (ties go to the nearer deadline, which the input order already reflects).
export function pickFeaturedGoal<T extends Goal>(
  activeGoals: readonly T[],
  tasks: readonly LinkedTask[],
): T | undefined {
  let featured: T | undefined;
  let best = -1;
  activeGoals.forEach(goal => {
    const { percent } = goalProgress(goal.id, tasks);
    if (percent > best) {
      best = percent;
      featured = goal;
    }
  });
  return featured;
}

// "Dec 2025", for a deadline ("2025-12-31") or a completion timestamp.
export function formatMonthYear(value: string): string {
  const [year, month] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

// "December 2025"
export function formatMonthYearLong(value: string): string {
  const [year, month] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

const DAYS_PER_MONTH = 30.44;
const MONTHS_FROM_DAYS = 31;

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

// "4 months remaining", "12 days remaining", "Due today", "Overdue by 3 days".
export function describeTimeRemaining(deadline: string, now: Date): string {
  const days = diffDays(deadline, toDateString(now));
  if (days < 0) {
    return `Overdue by ${plural(-days, 'day')}`;
  }
  if (days === 0) {
    return 'Due today';
  }
  if (days < MONTHS_FROM_DAYS) {
    return `${plural(days, 'day')} remaining`;
  }
  return `${plural(Math.round(days / DAYS_PER_MONTH), 'month')} remaining`;
}
