import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Attempt } from "@/lib/types";

export interface MissedQuestionSummary {
  prompt: string;
  correctText: string;
  explanation: string;
  missCount: number;
  attemptCount: number;
  sampleWrongAnswers: string[];
}

export interface WeekMissSummary {
  attemptCount: number;
  questions: MissedQuestionSummary[];
}

// Aggregates every recorded attempt across every session ever launched for
// this week (not just one class period) — the point is to surface which
// concepts THIS CONTENT trips students up on over time, not to grade one
// round.
export async function getWeekMissSummary(
  weekId: string
): Promise<WeekMissSummary> {
  const supabase = createAdminClient();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("week_id", weekId);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) {
    return { attemptCount: 0, questions: [] };
  }

  const { data: attempts } = await supabase
    .from("attempts")
    .select("details")
    .in("session_id", sessionIds);

  const rows = (attempts ?? []) as Pick<Attempt, "details">[];

  const byPrompt = new Map<
    string,
    { correctText: string; explanation: string; misses: number; wrongTexts: string[] }
  >();

  for (const row of rows) {
    for (const d of row.details ?? []) {
      const entry = byPrompt.get(d.prompt) ?? {
        correctText: d.correctText,
        explanation: d.explanation,
        misses: 0,
        wrongTexts: [],
      };
      if (!d.correct) {
        entry.misses += 1;
        if (entry.wrongTexts.length < 5) entry.wrongTexts.push(d.chosenText);
      }
      byPrompt.set(d.prompt, entry);
    }
  }

  const questions: MissedQuestionSummary[] = Array.from(byPrompt.entries())
    .filter(([, v]) => v.misses > 0)
    .map(([prompt, v]) => ({
      prompt,
      correctText: v.correctText,
      explanation: v.explanation,
      missCount: v.misses,
      attemptCount: rows.length,
      sampleWrongAnswers: v.wrongTexts,
    }))
    .sort((a, b) => b.missCount - a.missCount)
    .slice(0, 15);

  return { attemptCount: rows.length, questions };
}
