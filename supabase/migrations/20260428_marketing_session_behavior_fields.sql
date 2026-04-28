alter table public.marketing_sessions
  add column if not exists max_scroll_percent integer not null default 0,
  add column if not exists last_visible_section text,
  add column if not exists last_clicked_cta_id text,
  add column if not exists last_clicked_cta_label text,
  add column if not exists last_clicked_cta_section text;
