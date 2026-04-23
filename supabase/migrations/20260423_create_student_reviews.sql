create table if not exists public.student_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  rating smallint not null check (rating between 1 and 5),
  headline text,
  content text not null check (char_length(trim(content)) >= 30 and char_length(content) <= 2500),
  channel_name text,
  proof_url text,
  marketing_consent boolean not null default false,
  benefits jsonb not null default '{}'::jsonb,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected', 'archived')),
  feedback_tickets_granted integer not null default 3 check (feedback_tickets_granted >= 0),
  feedback_tickets_remaining integer not null default 3 check (feedback_tickets_remaining >= 0),
  monthly_draw_eligible boolean not null default true,
  kakao_invite_sent_at timestamptz,
  early_access_enabled_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists student_reviews_created_at_idx
  on public.student_reviews (created_at desc);

create index if not exists student_reviews_status_idx
  on public.student_reviews (status);

create or replace function public.set_student_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_student_reviews_updated_at on public.student_reviews;
create trigger set_student_reviews_updated_at
  before update on public.student_reviews
  for each row execute function public.set_student_reviews_updated_at();

alter table public.student_reviews enable row level security;

drop policy if exists "Users can view own student review" on public.student_reviews;
drop policy if exists "Users can insert own student review" on public.student_reviews;
drop policy if exists "Users can update own student review" on public.student_reviews;
drop policy if exists "Users can delete own student review" on public.student_reviews;

create policy "Users can view own student review"
  on public.student_reviews
  for select
  using (auth.uid() = user_id);
