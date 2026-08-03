import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Course, Week, GameSession, Attempt } from "@/lib/types";

const THEME_LABELS: Record<string, string> = {
  pac: "PAC",
  blocks: "BLOCKS",
  plumber: "PLUMBER",
};

export default async function SessionsHistoryPage() {
  const supabase = await createClient();

  const [{ data: sessions }, { data: courses }, { data: weeks }, { data: attempts }] =
    await Promise.all([
      supabase.from("sessions").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, name"),
      supabase.from("weeks").select("id, label"),
      supabase.from("attempts").select("id, session_id"),
    ]);

  const courseNames = new Map(
    (courses as Pick<Course, "id" | "name">[] | null ?? []).map((c) => [c.id, c.name])
  );
  const weekLabels = new Map(
    (weeks as Pick<Week, "id" | "label">[] | null ?? []).map((w) => [w.id, w.label])
  );
  const attemptCounts = new Map<string, number>();
  (attempts as Pick<Attempt, "id" | "session_id">[] | null ?? []).forEach((a) => {
    attemptCounts.set(a.session_id, (attemptCounts.get(a.session_id) ?? 0) + 1);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sessions history</h2>
        <Link
          href="/admin/sessions/new"
          className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500"
        >
          Launch a session
        </Link>
      </div>

      <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
        {((sessions as GameSession[] | null) ?? []).map((s) => (
          <li key={s.id}>
            <Link
              href={`/admin/sessions/${s.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-900"
            >
              <div>
                <p className="text-slate-100">
                  {courseNames.get(s.course_id) ?? "Unknown course"} —{" "}
                  {weekLabels.get(s.week_id) ?? "Unknown week"}
                </p>
                <p className="text-xs text-slate-500">
                  {THEME_LABELS[s.theme] ?? s.theme} · {s.mode} mode · code{" "}
                  {s.session_code} · {new Date(s.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{attemptCounts.get(s.id) ?? 0} attempt(s)</span>
                <span
                  className={`rounded px-2 py-0.5 ${
                    s.is_open
                      ? "bg-emerald-950 text-emerald-400"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {s.is_open ? "OPEN" : "ENDED"}
                </span>
              </div>
            </Link>
          </li>
        ))}
        {(!sessions || sessions.length === 0) && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            No sessions launched yet.
          </li>
        )}
      </ul>
    </div>
  );
}
