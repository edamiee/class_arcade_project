import { createClient } from "@/lib/supabase/server";
import type { Course, Week, Team } from "@/lib/types";
import LaunchSessionClient from "./launch-session-client";

export default async function NewSessionPage() {
  const supabase = await createClient();

  const [{ data: courses }, { data: weeks }, { data: teams }, { data: questions }] =
    await Promise.all([
      supabase.from("courses").select("*").order("created_at"),
      supabase.from("weeks").select("*").order("created_at"),
      supabase.from("teams").select("*").order("created_at"),
      supabase.from("questions").select("id, week_id"),
    ]);

  const questionCounts: Record<string, number> = {};
  (questions ?? []).forEach((q) => {
    questionCounts[q.week_id] = (questionCounts[q.week_id] ?? 0) + 1;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Launch a session</h2>
      <LaunchSessionClient
        courses={(courses ?? []) as Course[]}
        weeks={(weeks ?? []) as Week[]}
        initialTeams={(teams ?? []) as Team[]}
        questionCounts={questionCounts}
      />
    </div>
  );
}
