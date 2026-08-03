"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Week } from "@/lib/types";

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

  async function toggleShowExplanation(week: Week) {
    const supabase = createClient();
    const show_explanation = !week.show_explanation;
    const { error } = await supabase
      .from("weeks")
      .update({ show_explanation })
      .eq("id", week.id);
    if (error) {
      alert(error.message);
      return;
    }
    setWeeks((prev) =>
      prev.map((w) => (w.id === week.id ? { ...w, show_explanation } : w))
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addWeek} className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New week/topic label"
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
        >
          Add week
        </button>
      </form>

      <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
        {weeks.map((w) => (
          <li key={w.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <Link
                href={`/admin/courses/${courseId}/weeks/${w.id}`}
                className="flex-1 text-slate-100 hover:text-indigo-400"
              >
                {w.label}
                <span className="ml-2 text-xs text-slate-500">
                  {questionCounts[w.id] ?? 0} question(s)
                </span>
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={() => renameWeek(w)}
                  className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
                >
                  Rename
                </button>
                <button
                  onClick={() => deleteWeek(w)}
                  className="rounded-md border border-red-900 px-2 py-1 text-xs text-red-400 hover:border-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-slate-400">
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
                <input
                  type="checkbox"
                  checked={w.show_explanation}
                  onChange={() => toggleShowExplanation(w)}
                  className="accent-indigo-600"
                />
                Show explanation
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
