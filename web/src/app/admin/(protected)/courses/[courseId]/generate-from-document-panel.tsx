"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CreatedWeek {
  id: string;
  label: string;
  questionCount: number;
}

export default function GenerateFromDocumentPanel({
  courseId,
}: {
  courseId: string;
}) {
  const router = useRouter();
  const [document, setDocument] = useState("");
  const [targetWeeks, setTargetWeeks] = useState("");
  const [questionsPerWeek, setQuestionsPerWeek] = useState(5);
  const [type, setType] = useState<"mc" | "tf" | "mix">("mix");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedWeek[] | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!document.trim()) {
      setError("Paste in a document, syllabus, or notes to generate from.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/generate-questions-from-document", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseId,
          document,
          targetWeeks: targetWeeks || null,
          questionsPerWeek,
          type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setResult(data.weeks as CreatedWeek[]);
      setDocument("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="arcade-bezel p-4">
      <summary className="cursor-pointer font-semibold text-slate-100">
        Generate weeks from a document
      </summary>
      <form onSubmit={generate} className="mt-3 space-y-3">
        <p className="text-xs text-slate-500">
          Paste in a syllabus, textbook chapter, or lecture notes — this
          splits it into multiple weeks and generates questions for each,
          instead of one topic at a time.
        </p>
        <textarea
          value={document}
          onChange={(e) => setDocument(e.target.value)}
          placeholder="Paste the document here…"
          rows={8}
          className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Target weeks
            <input
              type="number"
              min={1}
              max={12}
              placeholder="auto"
              value={targetWeeks}
              onChange={(e) => setTargetWeeks(e.target.value)}
              className="w-20 rounded-md border-2 border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100 outline-none focus:border-indigo-500"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Questions/week
            <input
              type="number"
              min={1}
              max={20}
              value={questionsPerWeek}
              onChange={(e) => setQuestionsPerWeek(parseInt(e.target.value, 10) || 5)}
              className="w-16 rounded-md border-2 border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100 outline-none focus:border-indigo-500"
            />
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "mc" | "tf" | "mix")}
            className="rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
          >
            <option value="mix">Mix MC + TF</option>
            <option value="mc">Multiple choice only</option>
            <option value="tf">True/False only</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy ? "Generating… (this can take a minute)" : "Generate weeks"}
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {result && (
          <div className="space-y-1 rounded-md border-2 border-slate-800 p-3">
            <p className="text-sm font-semibold text-emerald-400">
              Created {result.length} week{result.length === 1 ? "" : "s"}:
            </p>
            <ul className="space-y-1 text-sm">
              {result.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/admin/courses/${courseId}/weeks/${w.id}`}
                    className="text-indigo-400 hover:underline"
                  >
                    {w.label}
                  </Link>{" "}
                  <span className="text-xs text-slate-500">
                    ({w.questionCount} questions)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </details>
  );
}
