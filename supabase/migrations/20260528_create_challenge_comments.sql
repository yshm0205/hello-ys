create table if not exists public.challenge_submission_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.challenge_mission_submissions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  content text not null check (char_length(trim(content)) between 1 and 1000),
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists challenge_submission_comments_submission_id_idx
  on public.challenge_submission_comments (submission_id, created_at asc);

create index if not exists challenge_submission_comments_user_id_idx
  on public.challenge_submission_comments (user_id, created_at desc);

drop trigger if exists set_challenge_submission_comments_updated_at on public.challenge_submission_comments;
create trigger set_challenge_submission_comments_updated_at
  before update on public.challenge_submission_comments
  for each row execute function public.set_challenge_updated_at();

alter table public.challenge_submission_comments enable row level security;

drop policy if exists "Challenge participants can view visible comments" on public.challenge_submission_comments;
create policy "Challenge participants can view visible comments"
  on public.challenge_submission_comments
  for select
  using (
    status = 'visible'
    and exists (
      select 1
      from public.challenge_enrollments ce
      where ce.user_id = auth.uid()
        and ce.status <> 'removed'
    )
  );

drop policy if exists "Challenge participants can insert own comments" on public.challenge_submission_comments;
create policy "Challenge participants can insert own comments"
  on public.challenge_submission_comments
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.challenge_enrollments ce
      where ce.user_id = auth.uid()
        and ce.status = 'active'
    )
  );
