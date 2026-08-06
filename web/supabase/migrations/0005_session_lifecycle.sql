-- #6: optional auto-close deadline for a session. Enforced lazily (this
-- app has no background job runner) — the first request that touches the
-- session after this time flips is_open to false.
alter table public.sessions add column auto_close_at timestamptz;

-- #5: lets an admin remove a disruptive/duplicate/wrong-class student from
-- a live session. Enforced by /api/play/answer and /api/play/submit, which
-- reject writes from a removed (session_id, student_id) pair — the
-- student's browser isn't force-disconnected, but their answers stop being
-- recorded.
create table public.session_removed_students (
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  removed_at timestamptz not null default now(),
  primary key (session_id, student_id)
);

alter table public.session_removed_students enable row level security;

create policy "admin full access" on public.session_removed_students
  for all using (is_admin()) with check (is_admin());
