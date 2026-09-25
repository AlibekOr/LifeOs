export type GoalCategory =
  | 'Career'
  | 'Learning'
  | 'Health'
  | 'Finance'
  | 'Personal';

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  category: GoalCategory;
  // "YYYY-MM-DD"; null = no deadline.
  deadline: string | null;
  // ISO timestamp of when the user marked the goal completed; null = active.
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GoalMilestone = {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type CreateGoalInput = {
  title: string;
  category: GoalCategory;
  deadline?: string | null;
};

export type UpdateGoalInput = Partial<CreateGoalInput> & {
  completed_at?: string | null;
};

export type CreateMilestoneInput = {
  goal_id: string;
  title: string;
  position?: number;
};

export type UpdateMilestoneInput = Partial<
  Pick<GoalMilestone, 'title' | 'position'>
>;
