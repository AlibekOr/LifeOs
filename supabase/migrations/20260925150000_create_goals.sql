-- Goals with optional milestones. Progress is never stored: it is the share of
-- completed tasks linked to the goal (or milestone), computed by the app.
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category text not null default 'Personal' check (
    category in ('Career', 'Learning', 'Health', 'Finance', 'Personal')
  ),
  deadline date,
  -- Set when the user marks the goal as completed; null = still active.
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_idx
  on public.goals (user_id, completed_at, deadline);

create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goal_milestones_goal_idx
  on public.goal_milestones (goal_id, position);

-- Reuses public.set_updated_at() from 20260923120000_create_tasks.sql.
drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row
  execute function public.set_updated_at();

drop trigger if exists goal_milestones_set_updated_at on public.goal_milestones;
create trigger goal_milestones_set_updated_at
  before update on public.goal_milestones
  for each row
  execute function public.set_updated_at();

alter table public.goals enable row level security;
alter table public.goals force row level security;
alter table public.goal_milestones enable row level security;
alter table public.goal_milestones force row level security;

drop policy if exists "Users can view own goals" on public.goals;
create policy "Users can view own goals"
  on public.goals
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own goals" on public.goals;
create policy "Users can insert own goals"
  on public.goals
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own goals" on public.goals;
create policy "Users can update own goals"
  on public.goals
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own goals" on public.goals;
create policy "Users can delete own goals"
  on public.goals
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- A milestone must sit under a goal the same user owns.
drop policy if exists "Users can view own milestones" on public.goal_milestones;
create policy "Users can view own milestones"
  on public.goal_milestones
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own milestones" on public.goal_milestones;
create policy "Users can insert own milestones"
  on public.goal_milestones
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update own milestones" on public.goal_milestones;
create policy "Users can update own milestones"
  on public.goal_milestones
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete own milestones" on public.goal_milestones;
create policy "Users can delete own milestones"
  on public.goal_milestones
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Tasks can be linked to a goal and, optionally, to one of its milestones.
-- Deleting a goal or milestone keeps the tasks and only removes the link.
alter table public.tasks
  add column if not exists goal_id uuid references public.goals (id) on delete set null,
  add column if not exists milestone_id uuid
    references public.goal_milestones (id) on delete set null;

create index if not exists tasks_goal_idx
  on public.tasks (goal_id) where goal_id is not null;
create index if not exists tasks_milestone_idx
  on public.tasks (milestone_id) where milestone_id is not null;

-- RLS on tasks only checks the task's own owner, so a client could point a task
-- at someone else's goal. This makes the database refuse that.
create or replace function public.tasks_check_goal_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Also runs when a deleted goal sets goal_id to null: a milestone cannot
  -- outlive its goal link, so it is cleared instead of raising.
  if new.goal_id is null then
    new.milestone_id := null;
    return new;
  end if;

  if not exists (
    select 1 from public.goals g
    where g.id = new.goal_id and g.user_id = new.user_id
  ) then
    raise exception 'A task can only be linked to one of your own goals'
      using errcode = '23503';
  end if;

  if new.milestone_id is not null and not exists (
    select 1 from public.goal_milestones m
    where m.id = new.milestone_id
      and m.goal_id = new.goal_id
      and m.user_id = new.user_id
  ) then
    raise exception 'A task milestone must belong to the linked goal'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_check_goal_link on public.tasks;
create trigger tasks_check_goal_link
  before insert or update of goal_id, milestone_id, user_id
  on public.tasks
  for each row
  execute function public.tasks_check_goal_link();
