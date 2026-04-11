-- Lecture tables should not be publicly readable with the anon key.
-- Allow authenticated users to read published lecture metadata/materials
-- and only manage their own lecture progress rows.

alter table if exists public.lectures enable row level security;
alter table if exists public.lecture_materials enable row level security;
alter table if exists public.lecture_progress enable row level security;

drop policy if exists "Allow admin full access on lectures" on public.lectures;
drop policy if exists "Authenticated users can read published lectures" on public.lectures;
create policy "Authenticated users can read published lectures"
  on public.lectures
  for select
  using (auth.uid() is not null and is_published = true);

drop policy if exists "Authenticated users can read materials" on public.lecture_materials;
drop policy if exists "Authenticated users can read published lecture materials" on public.lecture_materials;
create policy "Authenticated users can read published lecture materials"
  on public.lecture_materials
  for select
  using (
    auth.uid() is not null
    and exists (
      select 1
      from public.lectures l
      where l.is_published = true
        and concat('vod_', lpad(l.vod_number::text, 2, '0')) = lecture_materials.vod_id
    )
  );

drop policy if exists "Users can view own lecture progress" on public.lecture_progress;
drop policy if exists "Users can insert own lecture progress" on public.lecture_progress;
drop policy if exists "Users can update own lecture progress" on public.lecture_progress;
drop policy if exists "Users can delete own lecture progress" on public.lecture_progress;

create policy "Users can view own lecture progress"
  on public.lecture_progress
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own lecture progress"
  on public.lecture_progress
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lecture progress"
  on public.lecture_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own lecture progress"
  on public.lecture_progress
  for delete
  using (auth.uid() = user_id);
