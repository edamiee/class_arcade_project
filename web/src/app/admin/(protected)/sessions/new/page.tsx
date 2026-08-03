import { createClient } from "@/lib/supabase/server";
import type { Course, Week, Team } from "@/lib/types";
import LaunchSessionClient from "./launch-session-client";

export default async function NewSessionPage() {
  const supabase = await createClient();

  const [{ data: courses }, { data: weeks }, { data: teams }] =
    await Promise.all([
      supabase.from("courses").select("*").order("created_at"),
      supabase.from("weeks").select("*").order("created_at"),
      supabase.from("teams").select("*").order("created_at"),
    ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Launch a session</h2>
      <LaunchSessionClient
        courses={(courses ?? []) as Course[]}
        weeks={(weeks ?? []) as Week[]}
        initialTeams={(teams ?? []) as Team[]}
      />
    </div>
  );
}
