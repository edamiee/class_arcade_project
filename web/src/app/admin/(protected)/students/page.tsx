import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Student, Attempt } from "@/lib/types";
import StudentsListClient from "./students-list-client";

export default async function StudentsPage() {
  const supabase = await createClient();

  const [{ data: students }, { data: attempts }] = await Promise.all([
    supabase.from("students").select("*").order("name", { ascending: true }),
    supabase.from("attempts").select("id, student_id"),
  ]);

  const attemptCounts: Record<string, number> = {};
  (attempts as Pick<Attempt, "id" | "student_id">[] | null ?? []).forEach((a) => {
    attemptCounts[a.student_id] = (attemptCounts[a.student_id] ?? 0) + 1;
  });

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin"
          className="text-sm text-slate-400 hover:text-indigo-400"
        >
          ← Dashboard
        </Link>
        <h2 className="text-2xl font-bold">Students</h2>
      </div>
      <p className="text-sm text-slate-400">
        Everyone who has ever joined a session, matched by name. Rename to
        fix typos, or merge duplicates (e.g. &quot;Bob&quot; and
        &quot;Bobby&quot;) into one record.
      </p>
      <StudentsListClient
        initialStudents={(students ?? []) as Student[]}
        attemptCounts={attemptCounts}
      />
    </div>
  );
}
