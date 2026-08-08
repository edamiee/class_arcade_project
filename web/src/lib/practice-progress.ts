import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Attempt } from "@/lib/types";

export interface PracticeAttempt {
  attemptId: string;
  score: number;
  total: number;
  correctCount: number;
  playedAt: string;
}

export interface PracticeProgressStudent {
  studentId: string;
  name: string;
  attempts: PracticeAttempt[];
  bestScore: number;
  attemptCount: number;
}

interface AttemptRow extends Attempt {
  students: { name: string } | null;
}

// Unlike session-results.ts's leaderboard (which dedupes to each student's
// best attempt), this keeps every attempt so a practice session's retry
// history — improving, plateauing, whatever — is visible instead of
// thrown away.
export async function getPracticeProgress(
  sessionId: string
): Promise<PracticeProgressStudent[]> {
  const supabase = createAdminClient();
  const { data: attempts } = await supabase
    .from("attempts")
    .select("*, students(name)")
    .eq("session_id", sessionId)
    .order("played_at", { ascending: true });

  const byStudent = new Map<string, PracticeProgressStudent>();
  for (const row of (attempts ?? []) as unknown as AttemptRow[]) {
    let entry = byStudent.get(row.student_id);
    if (!entry) {
      entry = {
        studentId: row.student_id,
        name: row.students?.name ?? "Unknown",
        attempts: [],
        bestScore: 0,
        attemptCount: 0,
      };
      byStudent.set(row.student_id, entry);
    }
    entry.attempts.push({
      attemptId: row.id,
      score: row.score,
      total: row.total,
      correctCount: row.correct_count,
      playedAt: row.played_at,
    });
    entry.bestScore = Math.max(entry.bestScore, row.score);
    entry.attemptCount += 1;
  }

  return Array.from(byStudent.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
