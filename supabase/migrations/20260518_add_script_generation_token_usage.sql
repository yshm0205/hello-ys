alter table if exists public.script_generations
  add column if not exists token_usage jsonb;

comment on column public.script_generations.token_usage is
  'Token usage summary returned by script generator APIs.';
