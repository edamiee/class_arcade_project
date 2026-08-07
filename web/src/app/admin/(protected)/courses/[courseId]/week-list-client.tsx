"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ExplanationMode, Question, Week } from "@/lib/types";

export default function WeekListClient({
  courseId,
  initialWeeks,
  questionCounts,
}: {
  courseId: string;
  initialWeeks: Week[];
  questionCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [weeks, setWeeks] = useState(initialWeeks);
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  async function addWeek(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("weeks")
      .insert({ course_id: courseId, label })
      .select()
      .single();
    setBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    setWeeks((prev) => [...prev, data as Week]);
    setNewLabel("");
  }

  async function renameWeek(week: Week) {
    const label = prompt("Rename week/topic:", week.label);
    if (label === null) return;
    const trimmed = label.trim();
    if (!trimmed || trimmed === week.label) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("weeks")
      .update({ label: trimmed })
      .eq("id", week.id);
    if (error) {
      alert(error.message);
      return;
    }
    setWeeks((prev) =>
      prev.map((w) => (w.id === week.id ? { ...w, label: trimmed } : w))
    );
  }

  async function duplicateWeek(week: Week) {
    const label = prompt(
      "Name for the duplicated week:",
      `${week.label} (copy)`
    );
    if (label === null) return;
    const trimmed = label.trim();
    if (!trimmed) return;

    setDuplicatingId(week.id);
    const supabase = createClient();

    const { data: newWeek, error: weekError } = await supabase
      .from("weeks")
      .insert({
        course_id: courseId,
        label: trimmed,
        random_order: week.random_order,
        explanation_mode: week.explanation_mode,
      })
      .select()
      .single();
    if (weekError) {
      setDuplicatingId(null);
      alert(weekError.message);
      return;
    }

    const { data: sourceQuestions, error: fetchError } = await supabase
      .from("questions")
      .select("*")
      .eq("week_id", week.id);
    if (fetchError) {
      setDuplicatingId(null);
      alert(
        `Week created, but reading its questions failed: ${fetchError.message}`
      );
      setWeeks((prev) => [...prev, newWeek as Week]);
      router.refresh();
      return;
    }

    if (sourceQuestions && sourceQuestions.length > 0) {
      const rows = (sourceQuestions as Question[]).map((q) => ({
        week_id: newWeek.id,
        type: q.type,
        prompt: q.prompt,
        choices: q.choices,
        correct_index: q.correct_index,
        explanation: q.explanation,
      }));
      const { error: insertError } = await supabase
        .from("questions")
        .insert(rows);
      if (insertError) {
        alert(`Week created, but copying questions failed: ${insertError.message}`);
      }
    }

    setDuplicatingId(null);
    setWeeks((prev) => [...prev, newWeek as Week]);
    router.refresh();
  }

  async function deleteWeek(week: Week) {
    if (!confirm(`Delete "${week.label}" and all its questions?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("weeks").delete().eq("id", week.id);
    if (error) {
      alert(error.message);
      return;
    }
    setWeeks((prev) => prev.filter((w) => w.id !== week.id));
    router.refresh();
  }

  async function toggleRandomOrder(week: Week) {
    const supabase = createClient();
    const random_order = !week.random_order;
    const { error } = await supabase
      .from("weeks")
      .update({ random_order })
      .eq("id", week.id);
    if (error) {
      alert(error.message);
      return;
    }
    setWeeks((prev) =>
      prev.map((w) => (w.id === week.id ? { ...w, random_order } : w))
    );
  }

  async function updateExplanationMode(week: Week, explanation_mode: ExplanationMode) {
    const supabase = createClient();
    const { error } = await supabase
      .from("weeks")
      .update({ explanation_mode })
      .eq("id", week.id);
    if (error) {
      alert(error.message);
      return;
    }
    setWeeks((prev) =>
      prev.map((w) => (w.id === week.id ? { ...w, explanation_mode } : w))
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addWeek} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New week/topic label"
          className="min-w-0 rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 sm:flex-1"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
        >
          Add week
        </button>
      </form>

      <ul className="arcade-bezel divide-y divide-slate-800">
        {weeks.map((w) => (
          <li key={w.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <Link
                href={`/admin/courses/${courseId}/weeks/${w.id}`}
                className="text-slate-100 hover:text-indigo-400 sm:flex-1"
              >
                {w.label}
                <span className="ml-2 text-xs text-slate-500">
                  {questionCounts[w.id] ?? 0} question(s)
                </span>
              </Link>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => renameWeek(w)}
                  className="rounded-md border-2 border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
                >
                  Rename
                </button>
                <button
                  onClick={() => duplicateWeek(w)}
                  disabled={duplicatingId === w.id}
                  className="rounded-md border-2 border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500 disabled:opacity-50"
                >
                  {duplicatingId === w.id ? "Duplicating…" : "Duplicate"}
                </button>
                <button
                  onClick={() => deleteWeek(w)}
                  className="rounded-md border-2 border-red-900 px-2 py-1 text-xs text-red-400 hover:border-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={w.random_order}
                  onChange={() => toggleRandomOrder(w)}
                  className="accent-indigo-600"
                />
                Random order
              </label>
              <label className="flex items-center gap-1.5">
                Explanation
                <select
                  value={w.explanation_mode}
                  onChange={(e) =>
                    updateExplanationMode(w, e.target.value as ExplanationMode)
                  }
                  className="rounded-md border-2 border-slate-700 bg-slate-950 px-1.5 py-1 text-xs text-slate-100 outline-none focus:border-indigo-500"
                >
                  <option value="off">Don&apos;t show</option>
                  <option value="immediate">After each question</option>
                  <option value="end">Only at the end</option>
                </select>
              </label>
            </div>
          </li>
        ))}
        {weeks.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            No weeks yet — add one above.
          </li>
        )}
      </ul>
    </div>
  );
}
