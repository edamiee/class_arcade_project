import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";
import CourseListClient from "./course-list-client";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: true });

  const { data: weeks } = await supabase
    .from("weeks")
    .select("id, course_id");

  const weekCounts: Record<string, number> = {};
  (weeks ?? []).forEach((w) => {
    weekCounts[w.course_id] = (weekCounts[w.course_id] ?? 0) + 1;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Courses</h2>
      <CourseListClient
        initialCourses={(courses ?? []) as Course[]}
        weekCounts={weekCounts}
      />
    </div>
  );
}
