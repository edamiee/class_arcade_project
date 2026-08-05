"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export interface SessionRow {
  id: string;
  courseName: string;
  weekLabel: string;
  theme: string;
  mode: string;
  code: string;
  createdAt: string;
  attemptCount: number;
  isOpen: boolean;
}

const THEME_LABELS: Record<string, string> = {
  pac: "PAC",
  blocks: "BLOCKS",
  plumber: "PLUMBER",
};

export default function SessionsListClient({
  initialRows,
}: {
  initialRows: SessionRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))
    );
  }

  async function deleteIds(ids: string[]) {
    if (ids.length === 0) return;
    const label =
      ids.length === 1
        ? "Delete this session and all its recorded attempts?"
        : `Delete ${ids.length} sessions and all their recorded attempts?`;
    if (!confirm(`${label} This can't be undone.`)) return;

    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("sessions").delete().in("id", ids);
    setBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={selected.size === rows.length}
              onChange={toggleAll}
              className="accent-indigo-600"
            />
            Select all
          </label>
          <button
            onClick={() => deleteIds(Array.from(selected))}
            disabled={selected.size === 0 || busy}
            className="rounded-md border-2 border-red-900 px-2 py-1 text-red-400 hover:border-red-600 disabled:opacity-40"
          >
            Delete selected ({selected.size})
          </button>
        </div>
      )}

      <ul className="divide-y divide-slate-800 rounded-lg border-2 border-slate-800">
        {rows.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3">
            <input
              type="checkbox"
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
              className="accent-indigo-600"
            />
            <Link
              href={`/admin/sessions/${s.id}`}
              className="flex flex-1 items-center justify-between gap-4 hover:text-indigo-400"
            >
              <div>
                <p className="text-slate-100">
                  {s.courseName} — {s.weekLabel}
                </p>
                <p className="text-xs text-slate-500">
                  {THEME_LABELS[s.theme] ?? s.theme} · {s.mode} mode · code{" "}
                  {s.code} · {new Date(s.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{s.attemptCount} attempt(s)</span>
                <span
                  className={`rounded px-2 py-0.5 ${
                    s.isOpen
                      ? "bg-emerald-950 text-emerald-400"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {s.isOpen ? "OPEN" : "ENDED"}
                </span>
              </div>
            </Link>
            <Link
              href={`/admin/sessions/${s.id}/live`}
              className="shrink-0 rounded-md border-2 border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
            >
              Live
            </Link>
            <button
              onClick={() => deleteIds([s.id])}
              disabled={busy}
              className="shrink-0 rounded-md border-2 border-red-900 px-2 py-1 text-xs text-red-400 hover:border-red-600 disabled:opacity-40"
            >
              Delete
            </button>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            No sessions launched yet.
          </li>
        )}
      </ul>
    </div>
  );
}
