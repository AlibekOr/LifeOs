-- Set when the user presses "Start" on a task; null means it has not been started.
-- The countdown runs from this moment: end = started_at + duration_minutes.
-- Existing RLS policies are row-level, so they already cover the new column.
alter table public.tasks
  add column if not exists started_at timestamptz;
