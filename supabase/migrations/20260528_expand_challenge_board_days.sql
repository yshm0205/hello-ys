alter table public.challenge_mission_submissions
  drop constraint if exists challenge_mission_submissions_day_check;

alter table public.challenge_mission_submissions
  add constraint challenge_mission_submissions_day_check
  check (day between 1 and 5);
