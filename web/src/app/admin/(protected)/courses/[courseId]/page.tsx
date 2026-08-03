import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, Week } from "@/lib/types";
import WeekListClient from "./week-list-client";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  const { data: weeks } = await supabase
    .from("weeks")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  const { data: questions } = await supabase
    .from("questions")
    .select("id, week_id");

  const questionCounts: Record<string, number> = {};
  (questions ?? []).forEach((q) => {
    questionCounts[q.week_id] = (questionCounts[q.week_id] ?? 0) + 1;
  });

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/courses"
          className="text-sm text-slate-400 hover:text-indigo-400"
        >
          ← Courses
        </Link>
        <h2 className="text-2xl font-bold">{(course as Course).name}</h2>
      </div>
      <WeekListClient
        courseId={courseId}
        initialWeeks={(weeks ?? []) as Week[]}
        questionCounts={questionCounts}
      />
    </div>
  );
}
