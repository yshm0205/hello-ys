alter table if exists public.user_plans
  add column if not exists monthly_credit_amount integer not null default 0,
  add column if not exists monthly_credit_total_cycles integer null,
  add column if not exists monthly_credit_granted_cycles integer not null default 0,
  add column if not exists next_credit_at timestamptz null;

create index if not exists idx_user_plans_next_credit_at
  on public.user_plans (next_credit_at)
  where next_credit_at is not null;

alter table if exists public.user_plans
  drop constraint if exists user_plans_plan_type_check;

alter table if exists public.user_plans
  add constraint user_plans_plan_type_check
  check (plan_type in ('free', 'student_4m', 'subscriber_monthly', 'expired', 'allinone', 'pro'));
