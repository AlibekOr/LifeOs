-- Optional photo attachment per task, stored in the "Today's Schedule" bucket.
alter table public.tasks
  add column if not exists attachment_path text;

-- Keep the bucket private and cap individual uploads at 2MB (per-file limit only,
-- never surfaced to the user as a total-storage number).
update storage.buckets
set
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/heic', 'image/webp']
where id = 'Today''s Schedule';

-- storage.objects already has RLS enabled by default on every Supabase project;
-- this account isn't the table owner, so ALTER TABLE on it would fail here.

-- Objects are stored as "<user_id>/<task_id>.<ext>" — ownership is enforced by
-- matching the first path segment against the caller's auth.uid().
drop policy if exists "Users can view their own task attachments" on storage.objects;
create policy "Users can view their own task attachments"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'Today''s Schedule'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can upload their own task attachments" on storage.objects;
create policy "Users can upload their own task attachments"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'Today''s Schedule'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update their own task attachments" on storage.objects;
create policy "Users can update their own task attachments"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'Today''s Schedule'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'Today''s Schedule'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own task attachments" on storage.objects;
create policy "Users can delete their own task attachments"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'Today''s Schedule'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
