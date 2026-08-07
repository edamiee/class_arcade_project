"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/lib/types";

export default function CourseListClient({
  initialCourses,
  weekCounts,
}: {
  initialCourses: Course[];
  weekCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("courses")
      .insert({ name })
      .select()
      .single();
    setBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    setCourses((prev) => [...prev, data as Course]);
    setNewName("");
  }

  async function renameCourse(course: Course) {
    const name = prompt("Rename course:", course.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === course.name) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("courses")
      .update({ name: trimmed })
      .eq("id", course.id);
    if (error) {
      alert(error.message);
      return;
    }
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, name: trimmed } : c))
    );
  }

  async function deleteCourse(course: Course) {
    if (!confirm(`Delete "${course.name}" and all its weeks/questions?`))
      return;
    const supabase = createClient();
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", course.id);
    if (error) {
      alert(error.message);
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== course.id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addCourse} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New course name"
          className="min-w-0 rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 sm:flex-1"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
        >
          Add course
        </button>
      </form>

      <ul className="arcade-bezel divide-y divide-slate-800">
        {courses.map((c) => (
          <li
            key={c.id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <Link
              href={`/admin/courses/${c.id}`}
              className="text-slate-100 hover:text-indigo-400 sm:flex-1"
            >
              {c.name}
              <span className="ml-2 text-xs text-slate-500">
                {weekCounts[c.id] ?? 0} week(s)
              </span>
            </Link>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => renameCourse(c)}
                className="rounded-md border-2 border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
              >
                Rename
              </button>
              <button
                onClick={() => deleteCourse(c)}
                className="rounded-md border-2 border-red-900 px-2 py-1 text-xs text-red-400 hover:border-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {courses.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            No courses yet — add one above.
          </li>
        )}
      </ul>
    </div>
  );
}
