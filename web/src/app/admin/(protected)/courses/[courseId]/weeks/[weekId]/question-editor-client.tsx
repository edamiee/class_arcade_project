"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseBulkQuestions } from "@/lib/parse-bulk-questions";
import type { Question, QuestionType } from "@/lib/types";

const EMPTY_FORM = {
  type: "mc" as QuestionType,
  prompt: "",
  choices: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
};

export default function QuestionEditorClient({
  weekId,
  initialQuestions,
}: {
  weekId: string;
  initialQuestions: Question[];
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiTopic, setAiTopic] = useState("");
  const [aiType, setAiType] = useState<"mc" | "tf" | "mix">("mix");
  const [aiCount, setAiCount] = useState(5);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiStatus, setAiStatus] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  async function generateWithAi(e: React.FormEvent) {
    e.preventDefault();
    const topic = aiTopic.trim();
    if (!topic) {
      setAiStatus({ kind: "error", text: "Describe the topic/material to cover." });
      return;
    }
    setAiBusy(true);
    setAiStatus({ kind: "ok", text: "Generating…" });
    try {
      const res = await fetch("/api/admin/generate-questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weekId, topic, type: aiType, count: aiCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setQuestions((prev) => [...prev, ...(data.questions as Question[])]);
      setAiStatus({ kind: "ok", text: `Added ${data.added} question(s).` });
      setAiTopic("");
    } catch (err) {
      setAiStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Generation failed.",
      });
    } finally {
      setAiBusy(false);
    }
  }

  async function importBulk(e: React.FormEvent) {
    e.preventDefault();
    const { questions: parsed, errors } = parseBulkQuestions(bulkText);

    if (errors.length > 0) {
      const preview = errors
        .slice(0, 3)
        .map((err) => `line ${err.line}: ${err.message}`)
        .join("; ");
      setBulkStatus({
        kind: "error",
        text: `${errors.length} row(s) had problems: ${preview}${
          errors.length > 3 ? "…" : ""
        }`,
      });
      return;
    }
    if (parsed.length === 0) {
      setBulkStatus({ kind: "error", text: "Nothing to import — paste some rows first." });
      return;
    }

    setBulkBusy(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("questions")
      .insert(parsed.map((q) => ({ week_id: weekId, ...q })))
      .select();
    setBulkBusy(false);
    if (insertError) {
      setBulkStatus({ kind: "error", text: insertError.message });
      return;
    }
    setQuestions((prev) => [...prev, ...(data as Question[])]);
    setBulkStatus({ kind: "ok", text: `Imported ${data!.length} question(s).` });
    setBulkText("");
  }

  function startNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function startEdit(q: Question) {
    setEditingId(q.id);
    setForm({
      type: q.type,
      prompt: q.prompt,
      choices:
        q.type === "tf" ? ["True", "False"] : [...q.choices],
      correctIndex: q.correct_index,
      explanation: q.explanation,
    });
    setError(null);
  }

  function setType(type: QuestionType) {
    setForm((prev) => ({
      ...prev,
      type,
      choices: type === "tf" ? ["True", "False"] : ["", "", "", ""],
      correctIndex: 0,
    }));
  }

  function setChoice(i: number, value: string) {
    setForm((prev) => {
      const choices = [...prev.choices];
      choices[i] = value;
      return { ...prev, choices };
    });
  }

  function addChoice() {
    setForm((prev) => ({ ...prev, choices: [...prev.choices, ""] }));
  }

  function removeChoice(i: number) {
    setForm((prev) => {
      if (prev.choices.length <= 2) return prev;
      const choices = prev.choices.filter((_, idx) => idx !== i);
      const correctIndex =
        prev.correctIndex >= choices.length
          ? choices.length - 1
          : prev.correctIndex;
      return { ...prev, choices, correctIndex };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const prompt = form.prompt.trim();
    const choices = form.choices.map((c) => c.trim());
    if (!prompt) {
      setError("Prompt is required.");
      return;
    }
    if (choices.some((c) => !c)) {
      setError("All choices must be filled in.");
      return;
    }
    if (form.correctIndex < 0 || form.correctIndex >= choices.length) {
      setError("Pick a valid correct answer.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const payload = {
      week_id: weekId,
      type: form.type,
      prompt,
      choices,
      correct_index: form.correctIndex,
      explanation: form.explanation.trim(),
    };

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from("questions")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      setBusy(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingId ? (data as Question) : q))
      );
    } else {
      const { data, error: insertError } = await supabase
        .from("questions")
        .insert(payload)
        .select()
        .single();
      setBusy(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setQuestions((prev) => [...prev, data as Question]);
    }

    startNew();
  }

  async function deleteQuestion(q: Question) {
    if (!confirm("Delete this question?")) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("id", q.id);
    if (deleteError) {
      alert(deleteError.message);
      return;
    }
    setQuestions((prev) => prev.filter((x) => x.id !== q.id));
    if (editingId === q.id) startNew();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={generateWithAi}
        className="space-y-3 rounded-lg border-2 border-slate-800 p-4"
      >
        <h3 className="font-semibold text-slate-100">Generate with AI</h3>
        <textarea
          value={aiTopic}
          onChange={(e) => setAiTopic(e.target.value)}
          placeholder="Topic/material to cover (e.g. paste in notes, describe the concept)"
          rows={3}
          className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={aiType}
            onChange={(e) => setAiType(e.target.value as "mc" | "tf" | "mix")}
            className="rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
          >
            <option value="mix">Mix MC + TF</option>
            <option value="mc">Multiple choice only</option>
            <option value="tf">True/False only</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Count
            <input
              type="number"
              min={1}
              max={20}
              value={aiCount}
              onChange={(e) => setAiCount(parseInt(e.target.value, 10) || 5)}
              className="w-16 rounded-md border-2 border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100 outline-none focus:border-indigo-500"
            />
          </label>
          <button
            type="submit"
            disabled={aiBusy}
            className="rounded-md bg-indigo-600 px-4 py-1.5 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {aiBusy ? "Generating…" : "Generate"}
          </button>
        </div>
        {aiStatus && (
          <p
            className={
              aiStatus.kind === "error" ? "text-sm text-red-400" : "text-sm text-emerald-400"
            }
          >
            {aiStatus.text}
          </p>
        )}
      </form>

      <form
        onSubmit={importBulk}
        className="space-y-3 rounded-lg border-2 border-slate-800 p-4"
      >
        <h3 className="font-semibold text-slate-100">Bulk import</h3>
        <p className="text-xs text-slate-400">
          Paste rows copied from a spreadsheet (tab-separated) or comma-separated
          text. Each row:{" "}
          <code className="text-slate-300">
            type, prompt, correct #, explanation, choice 1, choice 2, …
          </code>
          . <code className="text-slate-300">type</code> is{" "}
          <code className="text-slate-300">mc</code> or{" "}
          <code className="text-slate-300">tf</code>; correct # is 1-based. For{" "}
          <code className="text-slate-300">tf</code> rows you can leave the choices
          off (defaults to True/False).
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={
            "mc, What is 2+2?, 2, Basic addition, 3, 4, 5, 6\ntf, The sky is blue., 1, "
          }
          rows={5}
          className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 outline-none focus:border-indigo-500"
        />
        {bulkStatus && (
          <p
            className={
              bulkStatus.kind === "error" ? "text-sm text-red-400" : "text-sm text-emerald-400"
            }
          >
            {bulkStatus.text}
          </p>
        )}
        <button
          type="submit"
          disabled={bulkBusy}
          className="rounded-md bg-indigo-600 px-4 py-1.5 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {bulkBusy ? "Importing…" : "Import rows"}
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <ul className="divide-y divide-slate-800 rounded-lg border-2 border-slate-800">
          {questions.map((q) => (
            <li
              key={q.id}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                  {q.type.toUpperCase()}
                </span>
                <p className="mt-1 truncate text-sm text-slate-200">
                  {q.prompt}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => startEdit(q)}
                  className="rounded-md border-2 border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteQuestion(q)}
                  className="rounded-md border-2 border-red-900 px-2 py-1 text-xs text-red-400 hover:border-red-600"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {questions.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              No questions yet — add one on the right.
            </li>
          )}
        </ul>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg border-2 border-slate-800 p-4"
      >
        <h3 className="font-semibold text-slate-100">
          {editingId ? "Edit question" : "New question"}
        </h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("mc")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              form.type === "mc"
                ? "bg-indigo-600 text-[var(--bg)]"
                : "border-2 border-slate-700 text-slate-300"
            }`}
          >
            Multiple choice
          </button>
          <button
            type="button"
            onClick={() => setType("tf")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              form.type === "tf"
                ? "bg-indigo-600 text-[var(--bg)]"
                : "border-2 border-slate-700 text-slate-300"
            }`}
          >
            True / False
          </button>
        </div>

        <textarea
          value={form.prompt}
          onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
          placeholder="Question prompt"
          rows={3}
          className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
        />

        <div className="space-y-2">
          {form.choices.map((choice, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctIndex"
                checked={form.correctIndex === i}
                onChange={() => setForm((p) => ({ ...p, correctIndex: i }))}
                className="accent-indigo-600"
              />
              <input
                value={choice}
                onChange={(e) => setChoice(i, e.target.value)}
                disabled={form.type === "tf"}
                placeholder={`Choice ${i + 1}`}
                className="flex-1 rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-500 disabled:opacity-60"
              />
              {form.type === "mc" && form.choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoice(i)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {form.type === "mc" && (
            <button
              type="button"
              onClick={addChoice}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              + Add choice
            </button>
          )}
        </div>

        <textarea
          value={form.explanation}
          onChange={(e) =>
            setForm((p) => ({ ...p, explanation: e.target.value }))
          }
          placeholder="Explanation (shown after answering, optional)"
          rows={2}
          className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {editingId ? "Save changes" : "Add question"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={startNew}
              className="rounded-md border-2 border-slate-700 px-4 py-2 text-slate-300 hover:border-slate-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      </div>
    </div>
  );
}
