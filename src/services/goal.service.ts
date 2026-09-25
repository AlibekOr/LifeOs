import { supabase } from '../shared/utils/supabase.ts';
import type {
  CreateGoalInput,
  CreateMilestoneInput,
  Goal,
  GoalMilestone,
  UpdateGoalInput,
  UpdateMilestoneInput,
} from '../types/goal.types.ts';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error(error?.message ?? 'Not authenticated');
  }
  return data.user.id;
}

async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('deadline', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

// Every milestone of the user in one request; the app groups them by goal.
async function getMilestones(): Promise<GoalMilestone[]> {
  const { data, error } = await supabase
    .from('goal_milestones')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      title: input.title,
      category: input.category,
      deadline: input.deadline ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Tasks linked to the goal stay; only their link is cleared (by the database).
async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

async function createMilestone(
  input: CreateMilestoneInput,
): Promise<GoalMilestone> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('goal_milestones')
    .insert({
      user_id: userId,
      goal_id: input.goal_id,
      title: input.title,
      position: input.position ?? 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function updateMilestone(
  id: string,
  input: UpdateMilestoneInput,
): Promise<GoalMilestone> {
  const { data, error } = await supabase
    .from('goal_milestones')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function deleteMilestone(id: string): Promise<void> {
  const { error } = await supabase
    .from('goal_milestones')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export const goalService = {
  getGoals,
  getMilestones,
  createGoal,
  updateGoal,
  deleteGoal,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};
