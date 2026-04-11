-- Lock down user-owned generation tables so anon/public clients cannot read
-- other users' data even though the anon key is exposed to the browser.

alter table if exists public.script_generations enable row level security;
alter table if exists public.batch_jobs enable row level security;
alter table if exists public.batch_job_items enable row level security;

drop policy if exists "Anon can read recent scripts" on public.script_generations;
drop policy if exists "Users can view own script_generations" on public.script_generations;
drop policy if exists "Users can insert own script_generations" on public.script_generations;
drop policy if exists "Users can update own script_generations" on public.script_generations;
drop policy if exists "Users can delete own script_generations" on public.script_generations;

create policy "Users can view own script_generations"
  on public.script_generations
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own script_generations"
  on public.script_generations
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own script_generations"
  on public.script_generations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own script_generations"
  on public.script_generations
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own batch_jobs" on public.batch_jobs;
drop policy if exists "Users can insert own batch_jobs" on public.batch_jobs;
drop policy if exists "Users can update own batch_jobs" on public.batch_jobs;
drop policy if exists "Users can delete own batch_jobs" on public.batch_jobs;

create policy "Users can view own batch_jobs"
  on public.batch_jobs
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own batch_jobs"
  on public.batch_jobs
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own batch_jobs"
  on public.batch_jobs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own batch_jobs"
  on public.batch_jobs
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own batch_job_items" on public.batch_job_items;
drop policy if exists "Users can insert own batch_job_items" on public.batch_job_items;
drop policy if exists "Users can update own batch_job_items" on public.batch_job_items;
drop policy if exists "Users can delete own batch_job_items" on public.batch_job_items;

create policy "Users can view own batch_job_items"
  on public.batch_job_items
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own batch_job_items"
  on public.batch_job_items
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own batch_job_items"
  on public.batch_job_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own batch_job_items"
  on public.batch_job_items
  for delete
  using (auth.uid() = user_id);
