import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STUDENT_SESSION_COOKIE,
  verifyStudentSessionToken,
} from "@/lib/student-session";
import { resolveSessionOpen } from "@/lib/session-lifecycle";
import { buildQuestionPlan } from "@/lib/question-order";
import type { GameSession, Question, Week } from "@/lib/types";
import PlayGameClient from "./play-game-client";

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

  const typedSession = session as GameSession | null;
  if (!typedSession || !(await resolveSessionOpen(supabase, typedSession))) {
    redirect("/join");
  }

  const [{ data: course }, { data: week }, { data: questions }] =
    await Promise.all([
      supabase
        .from("courses")
        .select("name")
        .eq("id", typedSession.course_id)
        .maybeSingle(),
      supabase
        .from("weeks")
        .select("*")
        .eq("id", typedSession.week_id)
        .maybeSingle(),
      supabase
        .from("questions")
        .select("*")
        .eq("week_id", typedSession.week_id),
    ]);

  const typedWeek = week as Week | null;
  const pool = (questions ?? []) as Question[];
  if (pool.length === 0) {
    redirect("/join");
  }

  const isPresenter = typedSession.pacing === "presenter";
  const preparedQuestions = isPresenter
    ? typedSession.question_order ?? []
    : buildQuestionPlan(
        pool,
        { random_order: typedWeek?.random_order !== false },
        typedSession.question_count
      );

  return (
    <PlayGameClient
      studentName={payload.studentName}
      teamName={payload.teamName}
      theme={typedSession.theme}
      courseName={course?.name ?? ""}
      weekLabel={typedWeek?.label ?? ""}
      explanationMode={typedWeek?.explanation_mode ?? "immediate"}
      sessionCode={typedSession.session_code}
      timerSeconds={typedSession.timer_seconds}
      questions={preparedQuestions}
      pacing={typedSession.pacing}
      initialIndex={isPresenter ? typedSession.current_question_index : 0}
      initialQuestionStartedAt={typedSession.question_started_at}
    />
  );
}
