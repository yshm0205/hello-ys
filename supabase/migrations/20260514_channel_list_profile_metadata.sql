alter table if exists public.channel_list
  add column if not exists profile_image_url text,
  add column if not exists total_video_count integer not null default 0;
