import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AnswerEvent } from "@/lib/types";

export interface QuestionStat {
  questionId: string;
  prompt: string;
  correctCount: number;
  wrongCount: number;
}

// Groups every answer_events row for a session by question, in the order
// those questions were originally created (matching how they appear in
// the week editor) rather than the order answers happened to arrive in.
export async function getSessionQuestionStats(
  sessionId: string
): Promise<QuestionStat[]> {
  const supabase = createAdminClient();

  const { data: events } = await supabase
    .from("answer_events")
    .select("question_id, prompt, correct")
    .eq("session_id", sessionId);

  const rows = (events ?? []) as Pick<
    AnswerEvent,
    "question_id" | "prompt" | "correct"
  >[];
  if (rows.length === 0) return [];

  const byQuestion = new Map<
    string,
    { prompt: string; correctCount: number; wrongCount: number }
  >();
  for (const row of rows) {
    const entry = byQuestion.get(row.question_id) ?? {
      prompt: row.prompt,
      correctCount: 0,
      wrongCount: 0,
    };
    if (row.correct) entry.correctCount += 1;
    else entry.wrongCount += 1;
    byQuestion.set(row.question_id, entry);
  }

  const questionIds = Array.from(byQuestion.keys());
  const { data: questions } = await supabase
    .from("questions")
    .select("id, created_at")
    .in("id", questionIds);

  const order = new Map(
    (questions ?? []).map((q) => [q.id as string, q.created_at as string])
  );

  return questionIds
    .map((questionId) => ({
      questionId,
      ...byQuestion.get(questionId)!,
    }))
    .sort((a, b) => {
      const aOrder = order.get(a.questionId) ?? "";
      const bOrder = order.get(b.questionId) ?? "";
      return aOrder.localeCompare(bOrder);
    });
}
