-- Adds per-session question-count and timer configuration, set by the
-- admin when launching a session.
--
-- question_count: how many questions to play, sliced from the shuffled
-- pool after random_order is applied. NULL means "play the whole week."
-- timer_seconds: seconds allowed per question. 0 means no timer (off),
-- matching the original single-file app's convention.

alter table public.sessions
  add column question_count int,
  add column timer_seconds int not null default 0;

alter table public.sessions
  add constraint sessions_question_count_check
  check (question_count is null or question_count > 0);

alter table public.sessions
  add constraint sessions_timer_seconds_check
  check (timer_seconds >= 0);
