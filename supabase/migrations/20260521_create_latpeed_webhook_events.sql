create table if not exists public.latpeed_webhook_events (
  id uuid default gen_random_uuid() primary key,
  event_key text unique not null,
  event_type text not null,
  payment_status text not null,
  signup_email text,
  amount integer,
  user_id uuid references public.users(id) on delete set null,
  payload jsonb not null,
  status text not null default 'received'
    check (status in ('received', 'processed', 'failed', 'duplicate')),
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.latpeed_webhook_events enable row level security;

drop policy if exists "No public access to latpeed webhook events"
  on public.latpeed_webhook_events;

create policy "No public access to latpeed webhook events"
  on public.latpeed_webhook_events
  for all
  using (false);

create index if not exists idx_latpeed_webhook_events_created_at
  on public.latpeed_webhook_events (created_at desc);

create index if not exists idx_latpeed_webhook_events_signup_email
  on public.latpeed_webhook_events (signup_email);

create index if not exists idx_latpeed_webhook_events_status
  on public.latpeed_webhook_events (status);

create table if not exists public.latpeed_payment_intents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  user_email text not null,
  user_name text,
  amount integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'matched', 'manual_review', 'expired')),
  latpeed_event_key text,
  payment_email text,
  payment_name text,
  payment_phone text,
  payment_date timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours'),
  matched_at timestamptz
);

alter table public.latpeed_payment_intents enable row level security;

drop policy if exists "No public access to latpeed payment intents"
  on public.latpeed_payment_intents;

create policy "No public access to latpeed payment intents"
  on public.latpeed_payment_intents
  for all
  using (false);

create index if not exists idx_latpeed_payment_intents_pending_match
  on public.latpeed_payment_intents (status, user_email, amount, created_at desc);

create index if not exists idx_latpeed_payment_intents_user_created
  on public.latpeed_payment_intents (user_id, created_at desc);

create index if not exists idx_latpeed_payment_intents_event_key
  on public.latpeed_payment_intents (latpeed_event_key);
