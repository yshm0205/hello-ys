-- 세션 trail (이벤트 시퀀스) 적재용 테이블
-- 한 세션이 어디 → 어디 → 어디 클릭했는지 시계열 추적

create table if not exists public.marketing_session_events (
  id uuid primary key default gen_random_uuid(),
  session_key text not null,
  marketing_token text,
  event_type text not null,
  page_path text,
  section text,
  scroll_percent integer,
  duration_seconds integer,
  cta_target text,
  cta_id text,
  cta_label text,
  cta_section text,
  referrer text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists marketing_session_events_session_key_idx
  on public.marketing_session_events (session_key, created_at);

create index if not exists marketing_session_events_created_at_idx
  on public.marketing_session_events (created_at desc);

create index if not exists marketing_session_events_event_type_idx
  on public.marketing_session_events (event_type, created_at desc);

alter table public.marketing_session_events enable row level security;
