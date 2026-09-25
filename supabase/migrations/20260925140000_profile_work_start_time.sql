-- When the user's working day starts. Used as the default start time of new
-- tasks and plans and as the default time of an all-day plan's reminder.
-- Existing profiles get 09:00; the user can change it in Profile.
alter table public.profiles
  add column if not exists work_start_time time not null default '09:00';
