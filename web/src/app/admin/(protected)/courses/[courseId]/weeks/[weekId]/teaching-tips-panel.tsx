"use client";

import { useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "message"; text: string }
  | { kind: "result"; markdown: string }
  | { kind: "error"; text: string };

export default function TeachingTipsPanel({ weekId }: { weekId: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function generate() {
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/admin/generate-teaching-tips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weekId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      if (data.message) {
        setStatus({ kind: "message", text: data.message });
      } else {
        setStatus({ kind: "result", markdown: data.markdown });
      }
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Generation failed.",
      });
    }
  }

  function downloadMarkdown(markdown: string) {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teaching-tips-${weekId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="arcade-bezel space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-100">Teaching tips</h3>
          <p className="text-xs text-slate-500">
            Analyzes every recorded attempt on this week&apos;s questions
            (across all sessions) and suggests how to reteach the concepts
            students miss most.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={status.kind === "loading"}
          className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {status.kind === "loading" ? "Analyzing…" : "Generate teaching tips"}
        </button>
      </div>

      {status.kind === "message" && (
        <p className="text-sm text-slate-400">{status.text}</p>
      )}
      {status.kind === "error" && (
        <p className="text-sm text-red-400">{status.text}</p>
      )}
      {status.kind === "result" && (
        <div className="space-y-2">
          <pre className="whitespace-pre-wrap rounded-md border-2 border-slate-800 bg-slate-950 p-3 text-xs text-slate-200">
            {status.markdown}
          </pre>
          <button
            onClick={() => downloadMarkdown(status.markdown)}
            className="rounded-md border-2 border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
          >
            Download .md
          </button>
        </div>
      )}
    </div>
  );
}
