import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, GameSession, Week } from "@/lib/types";
import { ClockIcon } from "@/components/dashboard-icons";
import LiveFeedClient from "./live-feed-client";
import PresenterControlClient from "./presenter-control-client";

const THEME_LABELS: Record<string, string> = {
  pac: "PAC",
  blocks: "BLOCKS",
  plumber: "PLUMBER",
};

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) notFound();
  const typedSession = session as GameSession;

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

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/admin/sessions/${sessionId}`}
          className="text-sm text-slate-400 hover:text-indigo-400"
        >
          ← Session results
        </Link>
        <div className="flex items-center gap-3">
          <span className="dc-icon">
            <ClockIcon />
          </span>
          <h2 className="brand-marquee text-2xl font-bold">Live</h2>
        </div>
        <p className="text-sm text-slate-400">
          {(course as Course | null)?.name} — {(week as Week | null)?.label} ·{" "}
          {THEME_LABELS[typedSession.theme] ?? typedSession.theme} ·{" "}
          {typedSession.mode} mode · code {typedSession.session_code}
        </p>
      </div>
      {typedSession.pacing === "presenter" && (
        <PresenterControlClient
          sessionId={sessionId}
          weekId={typedSession.week_id}
          questionCount={typedSession.question_count}
          initialCurrentQuestionIndex={typedSession.current_question_index}
          initialQuestionOrder={typedSession.question_order}
        />
      )}
      <LiveFeedClient sessionId={sessionId} theme={typedSession.theme} />
    </div>
  );
}
