"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Student } from "@/lib/types";

export default function StudentsListClient({
  initialStudents,
  attemptCounts,
  classNames,
}: {
  initialStudents: Student[];
  attemptCounts: Record<string, number>;
  classNames: Record<string, string[]>;
}) {
  const [students, setStudents] = useState(initialStudents);
  const [counts, setCounts] = useState(attemptCounts);
  const [classes, setClasses] = useState(classNames);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllSelected() {
    setSelected((prev) =>
      prev.size === students.length ? new Set() : new Set(students.map((s) => s.id))
    );
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const totalAttempts = ids.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
    if (
      !confirm(
        `Delete ${ids.length} student${ids.length === 1 ? "" : "s"} and all their recorded attempts (${totalAttempts} total)? This can't be undone.`
      )
    )
      return;
    setBulkBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("students").delete().in("id", ids);
    setBulkBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    setStudents((prev) => prev.filter((s) => !ids.includes(s.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

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
    setClasses((prev) => ({
      ...prev,
      [target.id]: Array.from(
        new Set([...(prev[target.id] ?? []), ...(prev[source.id] ?? [])])
      ).sort(),
    }));
    setStudents((prev) => prev.filter((s) => s.id !== source.id));
    setMergingId(null);
  }

  return (
    <div className="space-y-2">
      {students.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={selected.size === students.length}
              onChange={toggleAllSelected}
              className="accent-indigo-600"
            />
            Select all
          </label>
          <button
            onClick={deleteSelected}
            disabled={selected.size === 0 || bulkBusy}
            className="rounded-md border-2 border-red-900 px-2 py-1 text-red-400 hover:border-red-600 disabled:opacity-40"
          >
            Delete selected ({selected.size})
          </button>
        </div>
      )}

      <ul className="arcade-bezel divide-y divide-slate-800">
      {students.map((s) => (
        <li key={s.id} className="space-y-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selected.has(s.id)}
              onChange={() => toggleSelected(s.id)}
              className="accent-indigo-600"
            />
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <Link
                  href={`/admin/students/${s.id}`}
                  className="text-slate-100 hover:text-indigo-400"
                >
                  {s.name}
                </Link>
                <span className="ml-2 text-xs text-slate-500">
                  {counts[s.id] ?? 0} attempt(s) · joined{" "}
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
                <p className="text-xs text-slate-500">
                  {classes[s.id]?.length ? classes[s.id].join(", ") : "No classes yet"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => renameStudent(s)}
                  className="rounded-md border-2 border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
                >
                  Rename
                </button>
                <button
                  onClick={() => startMerge(s.id)}
                  className="rounded-md border-2 border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
                >
                  Merge into…
                </button>
                <button
                  onClick={() => deleteStudent(s)}
                  className="rounded-md border-2 border-red-900 px-2 py-1 text-xs text-red-400 hover:border-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {mergingId === s.id && (
            <div className="flex items-center gap-2 rounded-md border-2 border-slate-800 p-2">
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="flex-1 rounded-md border-2 border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
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
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-[var(--bg)] disabled:opacity-50"
              >
                Merge
              </button>
              <button
                onClick={() => setMergingId(null)}
                className="rounded-md border-2 border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500"
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
    </div>
  );
}
