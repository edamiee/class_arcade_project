import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STUDENT_SESSION_COOKIE,
  verifyStudentSessionToken,
} from "@/lib/student-session";
import { resolveSessionOpen } from "@/lib/session-lifecycle";
import type { GameSession } from "@/lib/types";

// Polled every ~1-2s by presenter-paced students (play-game-client.tsx) to
// find out when the teacher has advanced the class to the next question.
// Students have no Supabase access at all (RLS is admin-only everywhere),
// so this mirrors the same cookie-auth pattern as /api/play/answer and
// /api/play/submit rather than reading `sessions` directly.
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  const payload = token ? verifyStudentSessionToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Not joined." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", payload.sessionId)
    .maybeSingle();

  const typedSession = session as GameSession | null;
  if (!typedSession) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const isOpen = await resolveSessionOpen(supabase, typedSession);

  return NextResponse.json({
    pacing: typedSession.pacing,
    currentQuestionIndex: typedSession.current_question_index,
    questionStartedAt: typedSession.question_started_at,
    // Included so a student who was waiting in the lobby before "Start
    // round" was clicked can pick up the question content the moment it
    // becomes available, without a full page reload. Once non-null it
    // doesn't change again for the rest of the round, so this is cheap to
    // send on every poll.
    questionOrder: typedSession.question_order,
    isOpen,
  });
}
