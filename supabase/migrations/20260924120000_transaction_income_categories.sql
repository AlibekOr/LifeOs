-- Income transactions get their own categories (Salary, Project, Rent, ...).
-- Previously income had to have NO category; now every transaction has one and
-- the allowed values depend on the type.

-- Drop the old rules: the column-level list and the "income has no category" check.
alter table public.transactions
  drop constraint if exists transactions_category_check;
alter table public.transactions
  drop constraint if exists transactions_category_matches_type;

-- Existing income rows have no category; give them one before enforcing NOT NULL.
update public.transactions
set category = 'Other'
where type = 'income' and category is null;

alter table public.transactions
  alter column category set not null;

alter table public.transactions
  add constraint transactions_category_matches_type check (
    (
      type = 'expense'
      and category in ('Food', 'Transport', 'Education', 'Entertainment', 'Shopping', 'Other')
    )
    or (
      type = 'income'
      and category in ('Salary', 'Project', 'Rent', 'Business', 'Gift', 'Other')
    )
  );
