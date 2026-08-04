import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STUDENT_SESSION_COOKIE,
  verifyStudentSessionToken,
} from "@/lib/student-session";

// Fired once per question answered, in addition to (not instead of) the
// single end-of-round /api/play/submit write — powers the admin live feed
// and per-question chart. Identity comes from the signed cookie, same as
// submit. The client treats this as fire-and-forget: a failure here must
// never affect gameplay or the student's final score/submission.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  const payload = token ? verifyStudentSessionToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Not joined." }, { status: 401 });
  }

  const body = await request.json();
  const questionId: string = body.questionId;
  const prompt: string = body.prompt;
  const chosenText: string = body.chosenText;
  const correctText: string = body.correctText;
  const correct: boolean = body.correct;

  if (
    !questionId ||
    typeof prompt !== "string" ||
    typeof chosenText !== "string" ||
    typeof correctText !== "string" ||
    typeof correct !== "boolean"
  ) {
    return NextResponse.json({ error: "Malformed event." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("answer_events").insert({
    session_id: payload.sessionId,
    student_id: payload.studentId,
    student_name: payload.studentName,
    question_id: questionId,
    prompt,
    chosen_text: chosenText,
    correct_text: correctText,
    correct,
    team_id: payload.teamId,
    team_name: payload.teamName,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
