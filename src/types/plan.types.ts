export type PlanStatus = 'planned' | 'done' | 'cancelled';

export type Plan = {
  id: string;
  user_id: string;
  title: string;
  location: string | null;
  notes: string | null;
  // Local calendar date, "YYYY-MM-DD".
  plan_date: string;
  // Last day of a multi-day plan; null = single day.
  end_date: string | null;
  // Local time on the first day, "HH:MM:SS"; null = all day.
  plan_time: string | null;
  // "HH:MM:SS" on end_date (or plan_date for a single day); null = no end time,
  // which also means the plan does not block other plans.
  plan_end_time: string | null;
  // Reminder for a timed plan: minutes before plan_time.
  remind_minutes_before: number | null;
  // Reminder for an all-day plan: local time of day on plan_date, "HH:MM:SS".
  remind_time: string | null;
  status: PlanStatus;
  created_at: string;
  updated_at: string;
};

export type CreatePlanInput = {
  title: string;
  plan_date: string;
  location?: string | null;
  notes?: string | null;
  end_date?: string | null;
  plan_time?: string | null;
  plan_end_time?: string | null;
  remind_minutes_before?: number | null;
  remind_time?: string | null;
  // Lets a status change made offline merge into a still-queued create.
  status?: PlanStatus;
};

export type UpdatePlanInput = Partial<CreatePlanInput>;

// Inclusive "YYYY-MM-DD" bounds.
export type PlanRange = {
  from: string;
  to: string;
};
