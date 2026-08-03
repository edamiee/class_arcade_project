-- Penelope's Learning Arcade (web) — initial schema
--
-- Auth model:
--   - Admin: a single real Supabase Auth user, identified via the `admins` table
--     (insert one row for the admin's auth.users id after they sign up — see
--     README setup steps). RLS below grants that user full read/write on
--     everything.
--   - Students: NOT Supabase Auth users. They "log in" via a session code +
--     typed name (see app README for the /join flow). Because they have no
--     auth.uid(), RLS cannot usefully scope access to "this specific student" —
--     so RLS here is admin-only across the board, and all student-facing reads/
--     writes go through Next.js server routes using the Supabase *service role*
--     key (bypasses RLS, trusted server-only code), which enforce "you can only
--     touch your own attempt" in application code by checking the signed
--     session cookie. This is the standard pattern for a custom, non-Supabase-
--     Auth identity system.

create extension if not exists pgcrypto;

-- ---------- Content (admin-managed) ----------

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  label text not null,
  random_order boolean not null default true,
  show_explanation boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  type text not null check (type in ('mc', 'tf')),
  prompt text not null,
  choices jsonb not null, -- array of choice strings
  correct_index int not null,
  explanation text not null default '',
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------- Sessions (one row per round launched — never overwritten) ----------

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  week_id uuid not null references public.weeks(id),
  theme text not null default 'pac',
  mode text not null check (mode in ('individual', 'team')),
  session_code text not null unique,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

-- A session's team list is whichever teams are attached here (a session can
-- reuse existing teams or a fresh subset — kept as its own join table so
-- "which teams were available for this specific session" is part of the
-- permanent record, not just "whatever the teams table currently contains").
create table public.session_teams (
  session_id uuid not null references public.sessions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  primary key (session_id, team_id)
);

-- ---------- Students & attempts ----------

create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text generated always as (lower(trim(name))) stored,
  created_at timestamptz not null default now()
);
create unique index students_name_key_idx on public.students(name_key);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  team_id uuid references public.teams(id), -- team the student picked for this session, if mode = team
  score int not null,
  total int not null,
  correct_count int not null,
  details jsonb not null default '[]'::jsonb, -- [{prompt, chosenText, correctText, correct, explanation}, ...]
  played_at timestamptz not null default now()
);

-- ---------- Admin identity ----------

create table public.admins (
  id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$;

-- ---------- RLS: admin-only everywhere; students never get direct table access ----------

alter table public.courses enable row level security;
alter table public.weeks enable row level security;
alter table public.questions enable row level security;
alter table public.teams enable row level security;
alter table public.sessions enable row level security;
alter table public.session_teams enable row level security;
alter table public.students enable row level security;
alter table public.attempts enable row level security;
alter table public.admins enable row level security;

create policy "admin full access" on public.courses for all using (is_admin()) with check (is_admin());
create policy "admin full access" on public.weeks for all using (is_admin()) with check (is_admin());
create policy "admin full access" on public.questions for all using (is_admin()) with check (is_admin());
create policy "admin full access" on public.teams for all using (is_admin()) with check (is_admin());
create policy "admin full access" on public.sessions for all using (is_admin()) with check (is_admin());
create policy "admin full access" on public.session_teams for all using (is_admin()) with check (is_admin());
create policy "admin full access" on public.students for all using (is_admin()) with check (is_admin());
create policy "admin full access" on public.attempts for all using (is_admin()) with check (is_admin());
create policy "admin can read own admin row" on public.admins for select using (is_admin());

-- No policies grant anon/authenticated (non-admin) access to any table above.
-- All student-facing /join and /play operations use the service role key from
-- Next.js server routes, which bypasses RLS entirely (trusted server context).
