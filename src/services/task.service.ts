import { supabase } from '../shared/utils/supabase.ts';
import type {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from '../types/task.types.ts';

export function todayDateString() {
  return new Date().toLocaleDateString('en-CA');
}

async function getTodayTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('due_date', todayDateString())
    .order('scheduled_time', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

async function getAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

const UNIQUE_VIOLATION = '23505';

async function getTaskById(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function createTask(input: CreateTaskInput, id?: string): Promise<Task> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(userError?.message ?? 'Not authenticated');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...(id ? { id } : {}),
      user_id: userData.user.id,
      title: input.title,
      scheduled_time: input.scheduled_time,
      duration_minutes: input.duration_minutes,
      priority: input.priority ?? null,
      due_date: input.due_date ?? todayDateString(),
      attachment_path: input.attachment_path ?? null,
      is_completed: input.is_completed ?? false,
    })
    .select()
    .single();

  // A retried offline insert whose first attempt reached the server but whose
  // response was lost: the row already exists, so treat it as saved.
  if (error && id && error.code === UNIQUE_VIOLATION) {
    return getTaskById(id);
  }
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function setTaskCompletion(
  id: string,
  isCompleted: boolean,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ is_completed: isCompleted })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export const taskService = {
  getTodayTasks,
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  setTaskCompletion,
};
