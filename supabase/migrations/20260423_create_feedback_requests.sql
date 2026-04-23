create table if not exists public.feedback_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_id uuid references public.student_reviews(id) on delete set null,
  request_type text not null check (request_type in ('channel', 'topic', 'script', 'other')),
  title text not null check (char_length(trim(title)) between 2 and 120),
  description text not null check (char_length(trim(description)) >= 30 and char_length(description) <= 3000),
  reference_url text,
  status text not null default 'submitted' check (status in ('submitted', 'in_progress', 'answered', 'closed', 'rejected')),
  admin_note text,
  admin_response text,
  responded_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_requests_user_id_idx
  on public.feedback_requests (user_id, created_at desc);
create index if not exists feedback_requests_status_idx
  on public.feedback_requests (status, created_at desc);

create or replace function public.set_feedback_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_feedback_requests_updated_at on public.feedback_requests;
create trigger set_feedback_requests_updated_at
  before update on public.feedback_requests
  for each row execute function public.set_feedback_requests_updated_at();

alter table public.feedback_requests enable row level security;

drop policy if exists "Users can view own feedback requests" on public.feedback_requests;
create policy "Users can view own feedback requests"
  on public.feedback_requests
  for select
  using (auth.uid() = user_id);
