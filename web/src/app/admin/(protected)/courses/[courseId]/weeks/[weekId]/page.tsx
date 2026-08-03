import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, Week, Question } from "@/lib/types";
import QuestionEditorClient from "./question-editor-client";

export default async function WeekDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; weekId: string }>;
}) {
  const { courseId, weekId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  const { data: week } = await supabase
    .from("weeks")
    .select("*")
    .eq("id", weekId)
    .single();

  if (!course || !week) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("week_id", weekId)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/admin/courses/${courseId}`}
          className="text-sm text-slate-400 hover:text-indigo-400"
        >
          ← {(course as Course).name}
        </Link>
        <h2 className="text-2xl font-bold">{(week as Week).label}</h2>
      </div>
      <QuestionEditorClient
        weekId={weekId}
        initialQuestions={(questions ?? []) as Question[]}
      />
    </div>
  );
}
