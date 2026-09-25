-- Plans: an event or place on a date ("Oct 3 -> Samarkand", "18:00 -> gym").
-- Unlike tasks they have no duration or countdown.
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  location text check (location is null or char_length(location) <= 200),
  notes text check (notes is null or char_length(notes) <= 1000),
  -- Local calendar date the user picked; not a moment in time.
  plan_date date not null,
  -- Null = single day.
  end_date date check (end_date is null or end_date >= plan_date),
  -- Local wall-clock time on the first day; null = all day.
  plan_time time,
  remind_minutes_before integer check (
    remind_minutes_before is null or remind_minutes_before between 0 and 10080
  ),
  -- All-day plans have no start time to count back from, so the user picks the
  -- local time of day on plan_date for the reminder.
  remind_time time,
  status text not null default 'planned' check (
    status in ('planned', 'done', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A reminder is either "N minutes before plan_time" or "at remind_time".
  constraint plans_single_reminder check (
    remind_minutes_before is null or remind_time is null
  ),
  constraint plans_remind_time_all_day check (
    remind_time is null or plan_time is null
  ),
  constraint plans_remind_minutes_needs_time check (
    remind_minutes_before is null or plan_time is not null
  )
);

create index if not exists plans_user_date_idx
  on public.plans (user_id, plan_date);
create index if not exists plans_user_end_date_idx
  on public.plans (user_id, end_date);

-- Reuses public.set_updated_at() from 20260923120000_create_tasks.sql.
drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
  before update on public.plans
  for each row
  execute function public.set_updated_at();

alter table public.plans enable row level security;
alter table public.plans force row level security;

drop policy if exists "Users can view own plans" on public.plans;
create policy "Users can view own plans"
  on public.plans
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own plans" on public.plans;
create policy "Users can insert own plans"
  on public.plans
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own plans" on public.plans;
create policy "Users can update own plans"
  on public.plans
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own plans" on public.plans;
create policy "Users can delete own plans"
  on public.plans
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
