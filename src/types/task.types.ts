export type TaskPriority = 'High' | 'Medium' | 'Low';

export type Task = {
  id: string;
  user_id: string;
  title: string;
  scheduled_time: string;
  duration_minutes: number;
  priority: TaskPriority | null;
  is_completed: boolean;
  due_date: string;
  attachment_path: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTaskInput = {
  title: string;
  scheduled_time: string;
  duration_minutes: number;
  priority?: TaskPriority | null;
  due_date?: string;
  attachment_path?: string | null;
  is_completed?: boolean;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

export type TaskFilterPriority = TaskPriority | 'All';
