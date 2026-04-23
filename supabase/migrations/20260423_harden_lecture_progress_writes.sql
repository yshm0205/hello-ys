-- Lecture progress is derived from server-validated player heartbeats.
-- Users may read their own progress, but direct client writes would allow
-- forged completion states through the Supabase REST API.

alter table if exists public.lecture_progress
  add column if not exists watched_seconds integer not null default 0,
  add column if not exists last_progress_at timestamptz;

update public.lecture_progress
set watched_seconds = greatest(coalesce(watched_seconds, 0), coalesce(last_position, 0))
where watched_seconds < coalesce(last_position, 0);

drop policy if exists "Users can insert own lecture progress" on public.lecture_progress;
drop policy if exists "Users can update own lecture progress" on public.lecture_progress;
drop policy if exists "Users can delete own lecture progress" on public.lecture_progress;
