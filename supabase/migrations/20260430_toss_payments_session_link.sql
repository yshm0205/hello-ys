-- toss_payments에 session_key 추가 — 결제와 마케팅 세션 연결
-- 비로그인 세션의 결제 시도까지 묶어볼 수 있게 함

alter table public.toss_payments
  add column if not exists session_key text,
  add column if not exists marketing_token text;

create index if not exists toss_payments_session_key_idx
  on public.toss_payments (session_key);

create index if not exists toss_payments_marketing_token_idx
  on public.toss_payments (marketing_token);
