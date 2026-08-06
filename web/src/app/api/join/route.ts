import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createStudentSessionToken,
  STUDENT_SESSION_COOKIE,
} from "@/lib/student-session";
import { resolveSessionOpen } from "@/lib/session-lifecycle";
import type { GameSession, Student, Team } from "@/lib/types";

// Public — the actual join. Looks up-or-creates a student by name (matched
// case-insensitively via name_key) and issues the signed session cookie.
// No Supabase Auth identity is created; the service-role client bypasses
// RLS here as the trusted server-side path described in the schema's doc
// comments.
export async function POST(request: Request) {
  const body = await request.json();
  const code = (body.code || "").trim().toUpperCase();
  const name = (body.name || "").trim();
  const teamId: string | null = body.teamId || null;

  if (!code || !name) {
    return NextResponse.json(
      { error: "Code and name are required." },
      { status: 400 }
    );
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "Name is too long." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("session_code", code)
    .maybeSingle();
  const typedSession = session as GameSession | null;
  if (!typedSession || !(await resolveSessionOpen(supabase, typedSession))) {
    return NextResponse.json(
      { error: "That code isn't open right now." },
      { status: 404 }
    );
  }

  let teamName: string | null = null;
  if (typedSession.mode === "team") {
    if (!teamId) {
      return NextResponse.json({ error: "Pick a team." }, { status: 400 });
    }
    const { data: link } = await supabase
      .from("session_teams")
      .select("team_id, teams(name)")
      .eq("session_id", typedSession.id)
      .eq("team_id", teamId)
      .maybeSingle();
    if (!link) {
      return NextResponse.json(
        { error: "That team isn't available for this session." },
        { status: 400 }
      );
    }
    const team = Array.isArray(link.teams) ? link.teams[0] : link.teams;
    teamName = (team as Team | undefined)?.name ?? null;
  }

  const nameKey = name.toLowerCase();
  const { data: existingStudent } = await supabase
    .from("students")
    .select("*")
    .eq("name_key", nameKey)
    .maybeSingle();

  let student = existingStudent as Student | null;
  if (!student) {
    const { data: newStudent, error: insertError } = await supabase
      .from("students")
      .insert({ name })
      .select()
      .single();
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    student = newStudent as Student;
  }

  const token = createStudentSessionToken({
    studentId: student.id,
    studentName: student.name,
    sessionId: typedSession.id,
    teamId,
    teamName,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
