-- 수강생 전용 프로그램 배포: 비공개 Storage 버킷 + 다운로드 기록
-- 파일은 /api/programs/download 에서 권한 확인 후 서명 URL로만 내려준다.

insert into storage.buckets (id, name, public, file_size_limit)
values ('programs', 'programs', false, 209715200) -- 200MB
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create table if not exists public.program_downloads (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists program_downloads_user_id_idx on public.program_downloads (user_id, created_at desc);

-- 서버(service role)에서만 읽고 씀. 일반 사용자 정책 없음.
alter table public.program_downloads enable row level security;
