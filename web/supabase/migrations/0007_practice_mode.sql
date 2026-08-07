-- Practice/homework sessions: same self-paced mechanics as any other
-- session (replay already works — see session-results.ts's bestByStudent
-- dedup), just launched with a clear intent so the UI can (a) force
-- sensible defaults — self-paced, individual only, no synchronized
-- round or team scoring makes sense for "come back on your own time" —
-- and (b) offer a "Play again" link on the finished screen instead of
-- making a student re-navigate through /join to replay.
alter table public.sessions
  add column is_practice boolean not null default false;
