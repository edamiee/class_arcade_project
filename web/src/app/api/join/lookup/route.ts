import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GameSession } from "@/lib/types";

interface TeamRef {
  id: string;
  name: string;
}

// Public — no admin auth here on purpose. Students hit this before they
// have any identity at all, just to check "is this code live" and see
// what they're about to join. The service-role client is used because
// sessions/courses/weeks/teams all have admin-only RLS.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") || "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false });
  }

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("session_code", code)
    .eq("is_open", true)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ valid: false });
  }
  const typedSession = session as GameSession;

  const [{ data: course }, { data: week }, { data: sessionTeams }] =
    await Promise.all([
      supabase
        .from("courses")
        .select("name")
        .eq("id", typedSession.course_id)
        .maybeSingle(),
      supabase
        .from("weeks")
        .select("label")
        .eq("id", typedSession.week_id)
        .maybeSingle(),
      typedSession.mode === "team"
        ? supabase
            .from("session_teams")
            .select("team_id, teams(id, name)")
            .eq("session_id", typedSession.id)
        : Promise.resolve({ data: [] as { teams: TeamRef | TeamRef[] }[] }),
    ]);

  const teams = (sessionTeams ?? []).map((st: { teams: TeamRef | TeamRef[] }) => {
    const team = Array.isArray(st.teams) ? st.teams[0] : st.teams;
    return { id: team.id, name: team.name };
  });

  return NextResponse.json({
    valid: true,
    mode: typedSession.mode,
    theme: typedSession.theme,
    courseName: course?.name ?? "",
    weekLabel: week?.label ?? "",
    teams,
  });
}
