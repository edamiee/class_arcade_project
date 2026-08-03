import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STUDENT_SESSION_COOKIE,
  verifyStudentSessionToken,
} from "@/lib/student-session";
import type { GameSession, Question, Week } from "@/lib/types";
import PlayGameClient, { type PreparedQuestion } from "./play-game-client";

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function shuffleChoices(q: Question): PreparedQuestion {
  const indices = q.choices.map((_, i) => i);
  const shuffled = shuffle(indices);
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    choices: shuffled.map((i) => q.choices[i]),
    correctIndex: shuffled.indexOf(q.correct_index),
    explanation: q.explanation,
  };
}

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

  const orderedPool = typedWeek?.random_order !== false ? shuffle(pool) : pool;
  const preparedQuestions = orderedPool.map(shuffleChoices);

  return (
    <PlayGameClient
      studentName={payload.studentName}
      teamName={payload.teamName}
      theme={typedSession.theme}
      courseName={course?.name ?? ""}
      weekLabel={typedWeek?.label ?? ""}
      showExplanation={typedWeek?.show_explanation !== false}
      sessionCode={typedSession.session_code}
      questions={preparedQuestions}
    />
  );
}
