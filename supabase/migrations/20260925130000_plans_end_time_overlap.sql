-- Optional end time for a plan, and a rule that two plans cannot happen at the
-- same time. A plan with an end time occupies [start, end); a plan without one
-- is just a start moment and never blocks anything, but it may not start inside
-- another plan's interval. All-day plans never conflict.
alter table public.plans
  add column if not exists plan_end_time time;

-- An end time only makes sense next to a start time, and must come after it
-- (on end_date, so an overnight plan uses the next day as end_date).
alter table public.plans
  drop constraint if exists plans_end_time_needs_start;
alter table public.plans
  add constraint plans_end_time_needs_start check (
    plan_end_time is null or plan_time is not null
  );

alter table public.plans
  drop constraint if exists plans_end_after_start;
alter table public.plans
  add constraint plans_end_after_start check (
    plan_end_time is null
    or coalesce(end_date, plan_date) + plan_end_time > plan_date + plan_time
  );

-- Runs as the caller, so RLS limits the search to the caller's own plans.
create or replace function public.plans_prevent_overlap()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  new_start timestamp;
  new_end timestamp;
begin
  if new.status = 'cancelled' or new.plan_time is null then
    return new;
  end if;

  new_start := new.plan_date + new.plan_time;
  new_end := case
    when new.plan_end_time is null then null
    else coalesce(new.end_date, new.plan_date) + new.plan_end_time
  end;

  if exists (
    select 1
    from public.plans p
    where p.user_id = new.user_id
      and p.id <> new.id
      and p.status <> 'cancelled'
      and p.plan_time is not null
      and case
        -- Two intervals overlap.
        when new_end is not null and p.plan_end_time is not null then
          new_start < coalesce(p.end_date, p.plan_date) + p.plan_end_time
          and p.plan_date + p.plan_time < new_end
        -- The other plan starts inside the new interval.
        when new_end is not null then
          p.plan_date + p.plan_time >= new_start
          and p.plan_date + p.plan_time < new_end
        -- The new plan starts inside the other interval.
        when p.plan_end_time is not null then
          new_start >= p.plan_date + p.plan_time
          and new_start < coalesce(p.end_date, p.plan_date) + p.plan_end_time
        -- Two plans that are only start moments never conflict.
        else false
      end
  ) then
    -- 23P01 = exclusion_violation, so the app can tell it from other errors.
    raise exception 'plan_overlap: another plan is already scheduled at this time'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

drop trigger if exists plans_prevent_overlap on public.plans;
create trigger plans_prevent_overlap
  before insert or update of
    user_id, plan_date, end_date, plan_time, plan_end_time, status
  on public.plans
  for each row
  execute function public.plans_prevent_overlap();
