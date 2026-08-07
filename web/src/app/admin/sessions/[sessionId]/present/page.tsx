import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, GameSession, Week } from "@/lib/types";
import PresentWaiting from "./present-waiting";
import PresentClient from "./present-client";

// Deliberately outside the (protected) route group: that layout renders
// the admin's email + Log out button in a header, which would otherwise
// end up on this screen when it's projected for the whole class to see.
// Auth is still required — checked manually here, same two-step pattern
// as (protected)/layout.tsx (logged in, and present in public.admins).
export default async function PresentSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: adminRow } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!adminRow) redirect("/admin/login?error=not_admin");

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) notFound();
  const typedSession = session as GameSession;

  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const [{ data: course }, { data: week }] = await Promise.all([
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
  ]);

  const courseName = (course as Course | null)?.name ?? "";
  const weekLabel = (week as Week | null)?.label ?? "";
  const joinUrl = `${origin}/join?code=${typedSession.session_code}`;

  if (typedSession.pacing === "presenter") {
    return (
      <PresentClient
        sessionId={sessionId}
        theme={typedSession.theme}
        courseName={courseName}
        weekLabel={weekLabel}
        sessionCode={typedSession.session_code}
        joinUrl={joinUrl}
        initialCurrentQuestionIndex={typedSession.current_question_index}
        initialQuestionOrder={typedSession.question_order}
      />
    );
  }

  return (
    <PresentWaiting
      theme={typedSession.theme}
      courseName={courseName}
      weekLabel={weekLabel}
      sessionCode={typedSession.session_code}
      joinUrl={joinUrl}
    />
  );
}
