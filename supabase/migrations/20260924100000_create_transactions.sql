-- Income and expense entries backing the Finance screen.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  -- Whole UZS (no minor units); bigint avoids float rounding on money.
  amount bigint not null check (amount > 0),
  category text check (
    category in ('Food', 'Transport', 'Education', 'Entertainment', 'Shopping', 'Other')
  ),
  title text check (char_length(title) <= 120),
  occurred_on date not null default current_date,
  receipt_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Expenses are always categorised; the design defines no income categories.
  constraint transactions_category_matches_type check (
    (type = 'expense' and category is not null)
    or (type = 'income' and category is null)
  )
);

-- Finance screen always queries "this user's transactions within a month".
create index if not exists transactions_user_occurred_idx
  on public.transactions (user_id, occurred_on desc);

-- Reuses public.set_updated_at() from 20260923120000_create_tasks.sql.
drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

alter table public.transactions enable row level security;
alter table public.transactions force row level security;

drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions"
  on public.transactions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions"
  on public.transactions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions"
  on public.transactions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions"
  on public.transactions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Private receipts bucket, 2MB per file, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/heic', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Objects are stored as "<user_id>/<transaction_id>.<ext>"; ownership is
-- enforced by matching the first path segment against auth.uid().
drop policy if exists "Users can view their own receipts" on storage.objects;
create policy "Users can view their own receipts"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can upload their own receipts" on storage.objects;
create policy "Users can upload their own receipts"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update their own receipts" on storage.objects;
create policy "Users can update their own receipts"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'receipts'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'receipts'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own receipts" on storage.objects;
create policy "Users can delete their own receipts"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
