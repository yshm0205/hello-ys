alter table if exists public.channel_list
  add column if not exists first_upload_date date;

create index if not exists channel_list_first_upload_date_idx
  on public.channel_list (first_upload_date);
