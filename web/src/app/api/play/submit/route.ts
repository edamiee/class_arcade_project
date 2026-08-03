import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STUDENT_SESSION_COOKIE,
  verifyStudentSessionToken,
} from "@/lib/student-session";
import type { AttemptDetail } from "@/lib/types";

// Identity (student_id, session_id, team_id) always comes from the signed
// cookie, never from the request body — a student can't spoof who they are
// or which session/team they're submitting for.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  const payload = token ? verifyStudentSessionToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Not joined." }, { status: 401 });
  }

  const body = await request.json();
  const score = Number(body.score);
  const total = Number(body.total);
  const correctCount = Number(body.correctCount);
  const details = body.details as AttemptDetail[];

  if (
    !Number.isFinite(score) ||
    !Number.isFinite(total) ||
    !Number.isFinite(correctCount) ||
    !Array.isArray(details)
  ) {
    return NextResponse.json({ error: "Malformed submission." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("attempts").insert({
    student_id: payload.studentId,
    session_id: payload.sessionId,
    team_id: payload.teamId,
    score,
    total,
    correct_count: correctCount,
    details,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
