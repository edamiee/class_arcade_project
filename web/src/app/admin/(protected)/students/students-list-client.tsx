"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student } from "@/lib/types";

export default function StudentsListClient({
  initialStudents,
  attemptCounts,
}: {
  initialStudents: Student[];
  attemptCounts: Record<string, number>;
}) {
  const [students, setStudents] = useState(initialStudents);
  const [counts, setCounts] = useState(attemptCounts);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [busy, setBusy] = useState(false);

  async function renameStudent(student: Student) {
    const name = prompt("Rename student:", student.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === student.name) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("students")
      .update({ name: trimmed })
      .eq("id", student.id)
      .select()
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    setStudents((prev) =>
      prev
        .map((s) => (s.id === student.id ? (data as Student) : s))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  async function deleteStudent(student: Student) {
    if (
      !confirm(
        `Delete "${student.name}"? This also deletes their ${counts[student.id] ?? 0} recorded attempt(s). This can't be undone.`
      )
    )
      return;
    const supabase = createClient();
    const { error } = await supabase.from("students").delete().eq("id", student.id);
    if (error) {
      alert(error.message);
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== student.id));
  }

  function startMerge(studentId: string) {
    setMergingId(studentId);
    setMergeTargetId("");
  }

  async function confirmMerge(source: Student) {
    if (!mergeTargetId) return;
    const target = students.find((s) => s.id === mergeTargetId);
    if (!target) return;
    if (
      !confirm(
        `Move all of "${source.name}"'s attempts into "${target.name}" and delete "${source.name}"? This can't be undone.`
      )
    )
      return;

    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("attempts")
      .update({ student_id: target.id })
      .eq("student_id", source.id);
    if (updateError) {
      setBusy(false);
      alert(updateError.message);
      return;
    }
    const { error: deleteError } = await supabase
      .from("students")
      .delete()
      .eq("id", source.id);
    setBusy(false);
    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    setCounts((prev) => ({
      ...prev,
      [target.id]: (prev[target.id] ?? 0) + (prev[source.id] ?? 0),
    }));
    setStudents((prev) => prev.filter((s) => s.id !== source.id));
    setMergingId(null);
  }

  return (
    <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
      {students.map((s) => (
        <li key={s.id} className="space-y-2 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-slate-100">{s.name}</span>
              <span className="ml-2 text-xs text-slate-500">
                {counts[s.id] ?? 0} attempt(s) · joined{" "}
                {new Date(s.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => renameStudent(s)}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
              >
                Rename
              </button>
              <button
                onClick={() => startMerge(s.id)}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
              >
                Merge into…
              </button>
              <button
                onClick={() => deleteStudent(s)}
                className="rounded-md border border-red-900 px-2 py-1 text-xs text-red-400 hover:border-red-600"
              >
                Delete
              </button>
            </div>
          </div>

          {mergingId === s.id && (
            <div className="flex items-center gap-2 rounded-md border border-slate-800 p-2">
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
              >
                <option value="">Merge &quot;{s.name}&quot; into…</option>
                {students
                  .filter((other) => other.id !== s.id)
                  .map((other) => (
                    <option key={other.id} value={other.id}>
                      {other.name}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => confirmMerge(s)}
                disabled={!mergeTargetId || busy}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Merge
              </button>
              <button
                onClick={() => setMergingId(null)}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500"
              >
                Cancel
              </button>
            </div>
          )}
        </li>
      ))}
      {students.length === 0 && (
        <li className="px-4 py-6 text-center text-sm text-slate-500">
          No students have joined yet.
        </li>
      )}
    </ul>
  );
}
