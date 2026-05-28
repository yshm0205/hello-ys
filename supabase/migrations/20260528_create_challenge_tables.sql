create table if not exists public.challenge_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  cohort text not null default '1기',
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'removed')),
  access_starts_at timestamptz not null default now(),
  access_ends_at timestamptz,
  bonus_credits_granted integer not null default 0 check (bonus_credits_granted >= 0),
  discount_status text not null default 'none' check (discount_status in ('none', 'candidate', 'granted', 'not_eligible')),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cohort)
);

create index if not exists challenge_enrollments_user_id_idx
  on public.challenge_enrollments (user_id, created_at desc);

create index if not exists challenge_enrollments_status_idx
  on public.challenge_enrollments (status, created_at desc);

create table if not exists public.challenge_mission_submissions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.challenge_enrollments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  cohort text not null,
  day smallint not null check (day between 1 and 3),
  title text not null check (char_length(trim(title)) between 2 and 120),
  content text not null check (char_length(trim(content)) between 10 and 5000),
  reference_url text,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'approved', 'needs_revision')),
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cohort, day)
);

create index if not exists challenge_mission_submissions_user_id_idx
  on public.challenge_mission_submissions (user_id, created_at desc);

create index if not exists challenge_mission_submissions_status_idx
  on public.challenge_mission_submissions (status, created_at desc);

create or replace function public.set_challenge_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_challenge_enrollments_updated_at on public.challenge_enrollments;
create trigger set_challenge_enrollments_updated_at
  before update on public.challenge_enrollments
  for each row execute function public.set_challenge_updated_at();

drop trigger if exists set_challenge_mission_submissions_updated_at on public.challenge_mission_submissions;
create trigger set_challenge_mission_submissions_updated_at
  before update on public.challenge_mission_submissions
  for each row execute function public.set_challenge_updated_at();

alter table public.challenge_enrollments enable row level security;
alter table public.challenge_mission_submissions enable row level security;

drop policy if exists "Users can view own challenge enrollments" on public.challenge_enrollments;
create policy "Users can view own challenge enrollments"
  on public.challenge_enrollments
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can view own challenge submissions" on public.challenge_mission_submissions;
create policy "Users can view own challenge submissions"
  on public.challenge_mission_submissions
  for select
  using (auth.uid() = user_id);
