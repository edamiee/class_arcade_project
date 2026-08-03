import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STUDENT_SESSION_COOKIE,
  verifyStudentSessionToken,
} from "@/lib/student-session";
import type { GameSession } from "@/lib/types";

// Placeholder for now — confirms the join flow produced a valid signed
// session and shows what the student is about to play. The real game
// engine (theme, timer, scoring, writing an `attempts` row) is task 8.
export default async function PlayPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  const payload = token ? verifyStudentSessionToken(token) : null;

  if (!payload) {
    redirect("/join");
  }

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", payload.sessionId)
    .maybeSingle();

  if (!session || !session.is_open) {
    redirect("/join");
  }
  const typedSession = session as GameSession;

  const [{ data: course }, { data: week }] = await Promise.all([
    supabase
      .from("courses")
      .select("name")
      .eq("id", typedSession.course_id)
      .maybeSingle(),
    supabase
      .from("weeks")
      .select("label")
      .eq("id", typedSession.week_id)
      .maybeSingle(),
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-sm space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
        <p className="text-sm text-slate-400">You&apos;re in!</p>
        <h1 className="text-2xl font-bold">{payload.studentName}</h1>
        {payload.teamName && (
          <p className="text-sm text-indigo-400">{payload.teamName}</p>
        )}
        <p className="mt-4 text-slate-300">
          {course?.name} — {week?.label}
        </p>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {typedSession.theme} theme
        </p>
        <p className="mt-4 text-xs text-slate-500">
          The game screen isn&apos;t built yet — coming next.
        </p>
      </div>
    </div>
  );
}
