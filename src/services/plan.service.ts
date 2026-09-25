import { supabase } from '../shared/utils/supabase.ts';
import type {
  CreatePlanInput,
  Plan,
  PlanRange,
  PlanStatus,
  UpdatePlanInput,
} from '../types/plan.types.ts';

const UNIQUE_VIOLATION = '23505';
// Raised by the plans_prevent_overlap trigger.
const EXCLUSION_VIOLATION = '23P01';

export class PlanOverlapError extends Error {
  constructor() {
    super('Another plan is already scheduled at this time.');
    this.name = 'PlanOverlapError';
  }
}

function toPlanError(error: { code?: string; message: string }): Error {
  return error.code === EXCLUSION_VIOLATION
    ? new PlanOverlapError()
    : new Error(error.message);
}

// Plans that overlap the range: they start on or before `to` and end (or, for
// single-day plans, fall) on or after `from`.
async function getPlans(range: PlanRange): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .lte('plan_date', range.to)
    .or(
      `end_date.gte.${range.from},and(end_date.is.null,plan_date.gte.${range.from})`,
    )
    .order('plan_date', { ascending: true })
    .order('plan_time', { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

async function getPlanById(id: string): Promise<Plan> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function createPlan(input: CreatePlanInput, id?: string): Promise<Plan> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(userError?.message ?? 'Not authenticated');
  }

  const { data, error } = await supabase
    .from('plans')
    .insert({
      ...(id ? { id } : {}),
      user_id: userData.user.id,
      title: input.title,
      location: input.location ?? null,
      notes: input.notes ?? null,
      plan_date: input.plan_date,
      end_date: input.end_date ?? null,
      plan_time: input.plan_time ?? null,
      plan_end_time: input.plan_end_time ?? null,
      remind_minutes_before: input.remind_minutes_before ?? null,
      remind_time: input.remind_time ?? null,
      status: input.status ?? 'planned',
    })
    .select()
    .single();

  // A retried offline insert whose first attempt reached the server but whose
  // response was lost: the row already exists, so treat it as saved.
  if (error && id && error.code === UNIQUE_VIOLATION) {
    return getPlanById(id);
  }
  if (error) {
    throw toPlanError(error);
  }
  return data;
}

async function updatePlan(id: string, input: UpdatePlanInput): Promise<Plan> {
  const { data, error } = await supabase
    .from('plans')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw toPlanError(error);
  }
  return data;
}

async function setPlanStatus(id: string, status: PlanStatus): Promise<Plan> {
  return updatePlan(id, { status });
}

async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from('plans').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export const planService = {
  getPlans,
  createPlan,
  updatePlan,
  setPlanStatus,
  deletePlan,
};
