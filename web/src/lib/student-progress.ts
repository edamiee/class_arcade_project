import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Attempt, Student } from "@/lib/types";

export interface StudentWeekAttempt {
  attemptId: string;
  correctCount: number;
  total: number;
  score: number;
  playedAt: string;
  isPractice: boolean;
}

export interface StudentWeekProgress {
  courseName: string;
  weekLabel: string;
  attempts: StudentWeekAttempt[];
  bestPct: number;
}

export interface StudentProgress {
  student: Student;
  weeks: StudentWeekProgress[];
}

interface AttemptWithSession extends Attempt {
  sessions: {
    is_practice: boolean;
    weeks: { label: string } | null;
    courses: { name: string } | null;
  } | null;
}

// Groups a student's attempts by (course, week) rather than by raw session
// — a week can have multiple sessions against it (a live one-shot plus a
// practice session, or the same week re-launched on a later day), and
// "how are they doing on this content" is a per-week question, not a
// per-session one. correctCount/total (not score) drives the best-%
// badge since score includes play-game-client.tsx's streak-bonus 2x
// multiplier and isn't comparable across attempts the way a plain
// percentage is.
export async function getStudentProgress(
  studentId: string
): Promise<StudentProgress | null> {
  const supabase = createAdminClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return null;

  const { data: attempts } = await supabase
    .from("attempts")
    .select("*, sessions(is_practice, weeks(label), courses(name))")
    .eq("student_id", studentId)
    .order("played_at", { ascending: true });

  const byWeek = new Map<
    string,
    { courseName: string; weekLabel: string; attempts: StudentWeekAttempt[] }
  >();

  for (const row of (attempts ?? []) as unknown as AttemptWithSession[]) {
    const weekLabel = row.sessions?.weeks?.label ?? "Unknown week";
    const courseName = row.sessions?.courses?.name ?? "Unknown course";
    const key = `${courseName}::${weekLabel}`;
    let entry = byWeek.get(key);
    if (!entry) {
      entry = { courseName, weekLabel, attempts: [] };
      byWeek.set(key, entry);
    }
    entry.attempts.push({
      attemptId: row.id,
      correctCount: row.correct_count,
      total: row.total,
      score: row.score,
      playedAt: row.played_at,
      isPractice: row.sessions?.is_practice ?? false,
    });
  }

  const weeks: StudentWeekProgress[] = Array.from(byWeek.values())
    .map((entry) => {
      const bestPct = entry.attempts.reduce((best, a) => {
        const pct = a.total > 0 ? (a.correctCount / a.total) * 100 : 0;
        return Math.max(best, pct);
      }, 0);
      return { ...entry, bestPct };
    })
    // attempts within each week were already fetched in ascending order,
    // so the first one is that week's earliest attempt.
    .sort(
      (a, b) =>
        new Date(a.attempts[0].playedAt).getTime() -
        new Date(b.attempts[0].playedAt).getTime()
    );

  return { student: student as Student, weeks };
}
