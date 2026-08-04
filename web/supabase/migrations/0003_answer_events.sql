-- One row per question answered, written as it happens (in addition to,
-- not instead of, the existing `attempts` summary row written once at the
-- end of a full round). Powers two admin features: a live "watch answers
-- come in" feed, and a per-question correct/wrong chart for any session.
--
-- student_name/team_name are denormalized (same reasoning as
-- attempts.details already documents) so the live feed and chart don't
-- need a join per read and aren't affected by a later rename. question_id
-- is a real FK so the chart can group reliably; prompt is kept as a
-- snapshot too, for display and robustness against a question being
-- edited or deleted later.

create table public.answer_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_name text not null,
  question_id uuid not null references public.questions(id) on delete cascade,
  prompt text not null,
  chosen_text text not null,
  correct_text text not null,
  correct boolean not null,
  team_id uuid references public.teams(id),
  team_name text,
  answered_at timestamptz not null default now()
);
create index answer_events_session_idx on public.answer_events(session_id);

alter table public.answer_events enable row level security;
create policy "admin full access" on public.answer_events for all using (is_admin()) with check (is_admin());
