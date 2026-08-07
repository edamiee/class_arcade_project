"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { themeColors } from "@/lib/theme-colors";
import { MascotHeader } from "@/components/mascot";
import type { GameSession, PreparedQuestion } from "@/lib/types";
import PresentWaiting from "./present-waiting";

const POLL_MS = 2000;

// Presenter-paced sessions only. Read-only — no admin controls render
// here on purpose, this screen gets projected for the whole class to see.
// The "Next question" control lives on the private /live screen instead.
export default function PresentClient({
  sessionId,
  theme,
  courseName,
  weekLabel,
  sessionCode,
  joinUrl,
  initialCurrentQuestionIndex,
  initialQuestionOrder,
}: {
  sessionId: string;
  theme: string;
  courseName: string;
  weekLabel: string;
  sessionCode: string;
  joinUrl: string;
  initialCurrentQuestionIndex: number;
  initialQuestionOrder: PreparedQuestion[] | null;
}) {
  const colors = themeColors(theme);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialCurrentQuestionIndex
  );
  const [questionOrder, setQuestionOrder] = useState(initialQuestionOrder);

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

  const total = questionOrder?.length ?? 0;

  if (currentQuestionIndex < 0 || !questionOrder) {
    return (
      <PresentWaiting
        theme={theme}
        courseName={courseName}
        weekLabel={weekLabel}
        sessionCode={sessionCode}
        joinUrl={joinUrl}
      />
    );
  }

  if (currentQuestionIndex >= total) {
    return (
      <div
        data-theme={theme}
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 py-8 text-center"
      >
        <MascotHeader />
        <h1 className="text-4xl font-black" style={{ color: colors.yellow }}>
          ROUND COMPLETE
        </h1>
        <p className="text-lg text-slate-300">
          {courseName} — {weekLabel}
        </p>
      </div>
    );
  }

  const q = questionOrder[currentQuestionIndex];

  return (
    <div
      data-theme={theme}
      style={{ background: colors.bg, color: colors.text }}
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-8 text-center"
    >
      <p className="text-lg" style={{ color: colors.muted }}>
        Question {currentQuestionIndex + 1} of {total}
      </p>
      <p className="max-w-4xl text-4xl font-black">{q.prompt}</p>
      <div
        className={`grid w-full max-w-4xl gap-4 ${
          q.type === "tf" ? "grid-cols-2" : ""
        }`}
      >
        {q.choices.map((choice, i) => (
          <div
            key={i}
            className="rounded-md border-2 px-6 py-5 text-left text-2xl font-semibold"
            style={{ borderColor: colors.panelEdge }}
          >
            {choice}
          </div>
        ))}
      </div>
    </div>
  );
}
