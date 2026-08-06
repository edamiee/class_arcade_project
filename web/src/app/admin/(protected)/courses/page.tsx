import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookIcon } from "@/components/dashboard-icons";
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
      <div>
        <Link
          href="/admin"
          className="text-sm text-slate-400 hover:text-indigo-400"
        >
          ← Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="dc-icon">
            <BookIcon />
          </span>
          <h2 className="brand-marquee text-2xl font-bold">Courses</h2>
        </div>
      </div>
      <CourseListClient
        initialCourses={(courses ?? []) as Course[]}
        weekCounts={weekCounts}
      />
    </div>
  );
}
