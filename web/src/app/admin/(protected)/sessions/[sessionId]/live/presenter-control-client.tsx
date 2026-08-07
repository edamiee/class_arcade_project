"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildQuestionPlan } from "@/lib/question-order";
import type { GameSession, PreparedQuestion, Question, Week } from "@/lib/types";

const POLL_MS = 2000;

// Presenter-paced sessions only. Lives here (the private /live screen),
// never on /present — the projector must stay clean/student-facing, so a
// "Next question" control can't live there. All writes go straight
// through the browser Supabase client (admin RLS), same pattern as
// end-session-button.tsx's is_open toggle — no dedicated API route.
export default function PresenterControlClient({
  sessionId,
  weekId,
  questionCount,
  initialCurrentQuestionIndex,
  initialQuestionOrder,
}: {
  sessionId: string;
  weekId: string;
  questionCount: number | null;
  initialCurrentQuestionIndex: number;
  initialQuestionOrder: PreparedQuestion[] | null;
}) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialCurrentQuestionIndex
  );
  const [questionOrder, setQuestionOrder] = useState(initialQuestionOrder);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = questionOrder?.length ?? 0;
  const currentQuestion =
    questionOrder && currentQuestionIndex >= 0 && currentQuestionIndex < total
      ? questionOrder[currentQuestionIndex]
      : null;

  // Keeps this control in sync with the session row even if it was
  // advanced from elsewhere (another tab, another admin) — same polling
  // pattern as live-feed-client.tsx and present-client.tsx.
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function poll() {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
      if (cancelled || !data) return;
      const s = data as GameSession;
      setCurrentQuestionIndex(s.current_question_index);
      setQuestionOrder(s.question_order);
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!currentQuestion) {
      setAnsweredCount(0);
      return;
    }
    let cancelled = false;
    const supabase = createClient();

    async function poll() {
      const { count } = await supabase
        .from("answer_events")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId)
        .eq("question_id", currentQuestion!.id);
      if (!cancelled) setAnsweredCount(count ?? 0);
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId, currentQuestion]);

  async function startRound() {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const [{ data: week }, { data: questions }] = await Promise.all([
      supabase.from("weeks").select("*").eq("id", weekId).single(),
      supabase.from("questions").select("*").eq("week_id", weekId),
    ]);
    if (!week || !questions || questions.length === 0) {
      setBusy(false);
      setError("Couldn't load this week's questions.");
      return;
    }

    const plan = buildQuestionPlan(
      questions as Question[],
      week as Week,
      questionCount
    );

    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        question_order: plan,
        current_question_index: 0,
        question_started_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setQuestionOrder(plan);
    setCurrentQuestionIndex(0);
    router.refresh();
  }

  async function nextQuestion() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const nextIndex = currentQuestionIndex + 1;
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        current_question_index: nextIndex,
        question_started_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setCurrentQuestionIndex(nextIndex);
    router.refresh();
  }

  return (
    <div className="arcade-bezel space-y-3 p-4">
      <h3 className="font-semibold text-slate-100">Presenter controls</h3>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {currentQuestionIndex < 0 && (
        <>
          <p className="text-sm text-slate-400">
            The class is on the waiting screen. Start the round once
            everyone&apos;s joined.
          </p>
          <button
            onClick={startRound}
            disabled={busy}
            className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy ? "Starting…" : "Start round"}
          </button>
        </>
      )}

      {currentQuestionIndex >= 0 && currentQuestionIndex < total && (
        <>
          <p className="text-sm text-slate-300">
            Question {currentQuestionIndex + 1} of {total} ·{" "}
            <span className="text-slate-400">{answeredCount} answered</span>
          </p>
          {currentQuestion && (
            <p className="truncate text-sm text-slate-400">
              {currentQuestion.prompt}
            </p>
          )}
          <button
            onClick={nextQuestion}
            disabled={busy}
            className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy
              ? "…"
              : currentQuestionIndex + 1 >= total
                ? "End round"
                : "Next question →"}
          </button>
        </>
      )}

      {currentQuestionIndex >= total && total > 0 && (
        <p className="text-sm text-slate-400">Round complete.</p>
      )}
    </div>
  );
}
