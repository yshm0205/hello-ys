-- Remove overly broad public policies left on internal/admin tables.
-- Public reads for channel discovery data can stay, but internal writes should not.

drop policy if exists "Allow admin full access on credit_transactions" on public.credit_transactions;
drop policy if exists "Allow admin full access on hot_trends" on public.hot_trends;

drop policy if exists "Service can insert video_snapshots" on public.video_snapshots;
drop policy if exists "Service can update video_snapshots" on public.video_snapshots;

create policy "Service can insert video_snapshots"
  on public.video_snapshots
  for insert
  to service_role
  with check (true);

create policy "Service can update video_snapshots"
  on public.video_snapshots
  for update
  to service_role
  using (true)
  with check (true);
