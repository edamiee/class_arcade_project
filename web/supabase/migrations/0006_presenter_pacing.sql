-- Presenter-paced ("Kahoot-style") sessions: the teacher controls when the
-- whole class advances to the next question, instead of each student
-- clicking through at their own speed. Orthogonal to `mode` (scoring
-- grouping) — a presenter-paced session can still be individual or team.
--
-- pacing: 'self' (today's behavior, unchanged) or 'presenter'.
-- question_order: for presenter-paced sessions only, the *entire* prepared
-- question list (id, type, prompt, already-shuffled choices, correct_index,
-- explanation — the same shape buildQuestionPlan()/shuffleChoices() already
-- produces per-student for self-paced sessions), computed ONCE when the
-- admin clicks "Start round" on /admin/sessions/[id]/live. Every student
-- who loads /play, and the projected /present screen, read this same
-- snapshot — everyone sees the identical question AND choice order at the
-- identical moment. Null until "Start round" is clicked; always
-- null/unused for self-paced sessions.
-- current_question_index: -1 = round not started yet (still on the
-- QR/join screen). 0..N-1 = which entry of question_order is live. N =
-- round complete. Advanced only by the admin, via a direct client-side
-- `sessions` update from /live — same pattern as end-session-button.tsx's
-- is_open toggle, no dedicated API route for this write.
-- question_started_at: set alongside every current_question_index change —
-- the shared origin every client (students + the projector) computes its
-- per-question countdown from.

alter table public.sessions
  add column pacing text not null default 'self',
  add column question_order jsonb,
  add column current_question_index int not null default -1,
  add column question_started_at timestamptz;

alter table public.sessions
  add constraint sessions_pacing_check check (pacing in ('self', 'presenter'));

alter table public.sessions
  add constraint sessions_current_question_index_check check (current_question_index >= -1);
