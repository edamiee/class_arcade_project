"use client";

import { useState } from "react";
import type { IndividualResult } from "@/lib/session-results";

type TipStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "message"; text: string }
  | { kind: "result"; markdown: string }
  | { kind: "error"; text: string };

// Admin-only variant of the individual leaderboard: same visual treatment
// as the public one, plus a per-student "Tips" button that calls the
// existing /api/admin/generate-tips route (a per-attempt remediation note,
// distinct from the aggregate teaching-tips feature on the week page).
export default function IndividualLeaderboardAdmin({
  individual,
}: {
  individual: IndividualResult[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, TipStatus>>({});

  async function generate(r: IndividualResult) {
    setOpenId(r.attemptId);
    setStatus((prev) => ({ ...prev, [r.attemptId]: { kind: "loading" } }));
    try {
      const res = await fetch("/api/admin/generate-tips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: r.attemptId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setStatus((prev) => ({
        ...prev,
        [r.attemptId]: data.message
          ? { kind: "message", text: data.message }
          : { kind: "result", markdown: data.markdown },
      }));
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        [r.attemptId]: {
          kind: "error",
          text: err instanceof Error ? err.message : "Generation failed.",
        },
      }));
    }
  }

  return (
    <ul className="arcade-bezel divide-y-2 divide-slate-800">
      {individual.map((r, i) => {
        const s = status[r.attemptId] ?? { kind: "idle" };
        return (
          <li
            key={r.studentId}
            className={`px-4 py-3 ${i === 0 ? "winner-badge" : ""}`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className={i === 0 ? "text-xs" : "text-xs text-slate-500"}>
                  #{i + 1}
                </span>
                {i === 0 && <span>🏆</span>}
                <span className={i === 0 ? "font-bold" : "text-slate-100"}>
                  {r.name}
                </span>
                {r.teamName && (
                  <span className={i === 0 ? "text-xs" : "text-xs text-slate-500"}>
                    {r.teamName}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-3">
                <span className={i === 0 ? "text-sm font-bold" : "text-sm text-slate-400"}>
                  <span
                    className="text-xl font-black"
                    style={
                      i === 0
                        ? undefined
                        : { color: "var(--yellow)", textShadow: "0 0 8px rgba(255,212,0,0.7)" }
                    }
                  >
                    {r.score}
                  </span>{" "}
                  pts · {r.correctCount}/{r.total} correct
                </span>
                <button
                  onClick={() => generate(r)}
                  disabled={s.kind === "loading"}
                  className={
                    i === 0
                      ? "shrink-0 rounded-md border-2 border-black/40 px-2 py-1 text-xs font-semibold text-black hover:border-black/70 disabled:opacity-50"
                      : "shrink-0 rounded-md border-2 border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500 disabled:opacity-50"
                  }
                >
                  {s.kind === "loading" ? "…" : "Tips"}
                </button>
              </div>
            </div>

            {openId === r.attemptId && s.kind === "message" && (
              <p className="mt-2 text-xs text-slate-400">{s.text}</p>
            )}
            {openId === r.attemptId && s.kind === "error" && (
              <p className="mt-2 text-xs text-red-400">{s.text}</p>
            )}
            {openId === r.attemptId && s.kind === "result" && (
              <pre className="mt-2 whitespace-pre-wrap rounded-md border-2 border-slate-800 bg-slate-950 p-3 text-xs text-slate-200">
                {s.markdown}
              </pre>
            )}
          </li>
        );
      })}
    </ul>
  );
}
