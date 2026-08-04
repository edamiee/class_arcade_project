import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GameSession, Attempt } from "@/lib/types";

export interface IndividualResult {
  studentId: string;
  attemptId: string;
  name: string;
  score: number;
  total: number;
  correctCount: number;
  teamId: string | null;
  teamName: string | null;
}

export interface TeamResult {
  teamId: string;
  name: string;
  totalScore: number;
  memberCount: number;
}

export interface SessionResults {
  session: GameSession;
  courseName: string;
  weekLabel: string;
  individual: IndividualResult[];
  teams: TeamResult[] | null;
}

interface AttemptRow extends Attempt {
  students: { name: string } | null;
  teams: { name: string } | null;
}

// Shared by the admin session-detail page and the public /results/[code]
// page (students see the same leaderboard). A student who replayed a
// session has multiple attempts rows; only their best score counts toward
// the leaderboard and their team's total.
export async function getSessionResultsById(
  sessionId: string
): Promise<SessionResults | null> {
  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return null;
  return buildResults(session as GameSession);
}

export async function getSessionResultsByCode(
  code: string
): Promise<SessionResults | null> {
  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("session_code", code.trim().toUpperCase())
    .maybeSingle();
  if (!session) return null;
  return buildResults(session as GameSession);
}

async function buildResults(session: GameSession): Promise<SessionResults> {
  const supabase = createAdminClient();

  const [{ data: course }, { data: week }, { data: attempts }] =
    await Promise.all([
      supabase.from("courses").select("name").eq("id", session.course_id).maybeSingle(),
      supabase.from("weeks").select("label").eq("id", session.week_id).maybeSingle(),
      supabase
        .from("attempts")
        .select("*, students(name), teams(name)")
        .eq("session_id", session.id)
        .order("score", { ascending: false }),
    ]);

  const bestByStudent = new Map<string, AttemptRow>();
  for (const row of (attempts ?? []) as unknown as AttemptRow[]) {
    const existing = bestByStudent.get(row.student_id);
    if (!existing || row.score > existing.score) {
      bestByStudent.set(row.student_id, row);
    }
  }

  const individual: IndividualResult[] = Array.from(bestByStudent.values())
    .map((row) => ({
      studentId: row.student_id,
      attemptId: row.id,
      name: row.students?.name ?? "Unknown",
      score: row.score,
      total: row.total,
      correctCount: row.correct_count,
      teamId: row.team_id,
      teamName: row.teams?.name ?? null,
    }))
    .sort((a, b) => b.score - a.score);

  let teams: TeamResult[] | null = null;
  if (session.mode === "team") {
    const totals = new Map<string, TeamResult>();
    for (const r of individual) {
      if (!r.teamId) continue;
      const existing = totals.get(r.teamId);
      if (existing) {
        existing.totalScore += r.score;
        existing.memberCount += 1;
      } else {
        totals.set(r.teamId, {
          teamId: r.teamId,
          name: r.teamName ?? "Unknown team",
          totalScore: r.score,
          memberCount: 1,
        });
      }
    }
    teams = Array.from(totals.values()).sort(
      (a, b) => b.totalScore - a.totalScore
    );
  }

  return {
    session,
    courseName: course?.name ?? "",
    weekLabel: week?.label ?? "",
    individual,
    teams,
  };
}
