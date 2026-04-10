create table if not exists public.batch_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  niche text not null default 'knowledge',
  status text not null default 'draft' check (status in ('draft', 'running', 'paused', 'completed', 'failed')),
  current_item_id uuid null,
  last_error text null,
  total_count integer not null default 0,
  queued_count integer not null default 0,
  processing_count integer not null default 0,
  done_count integer not null default 0,
  error_count integer not null default 0,
  started_at timestamptz null,
  finished_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.batch_job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.batch_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sort_order integer not null,
  material text not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'done', 'error', 'cancelled')),
  phase text null check (phase in ('analyzing', 'generating', 'reviewing')),
  scripts jsonb null,
  error text null,
  elapsed integer null,
  credits_deducted integer not null default 0,
  started_at timestamptz null,
  finished_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_batch_jobs_user_status
  on public.batch_jobs (user_id, status, created_at desc);

create index if not exists idx_batch_job_items_job_order
  on public.batch_job_items (job_id, sort_order asc);

create index if not exists idx_batch_job_items_user_status
  on public.batch_job_items (user_id, status, created_at desc);

create unique index if not exists idx_batch_jobs_one_active_per_user
  on public.batch_jobs (user_id)
  where status in ('draft', 'running', 'paused');
