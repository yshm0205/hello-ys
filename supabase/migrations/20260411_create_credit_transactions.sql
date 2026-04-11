create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('charge', 'usage', 'refund', 'manual_add', 'manual_deduct')),
  amount integer not null,
  balance_after integer not null,
  description text,
  admin_note text,
  reference_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_transactions_user_id_created_at
  on public.credit_transactions (user_id, created_at desc);

create index if not exists idx_credit_transactions_type_created_at
  on public.credit_transactions (type, created_at desc);

alter table if exists public.credit_transactions enable row level security;

drop policy if exists "Users can view own credit transactions" on public.credit_transactions;
drop policy if exists "Allow admin full access on credit_transactions" on public.credit_transactions;

create policy "Users can view own credit transactions"
  on public.credit_transactions
  for select
  using (auth.uid() = user_id);
