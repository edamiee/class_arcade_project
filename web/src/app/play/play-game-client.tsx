"use client";

import { useMemo, useState } from "react";
import { themeColors } from "@/lib/theme-colors";
import { playCorrectSound, playLifeLostSound } from "@/lib/sound";
import type { AttemptDetail, QuestionType } from "@/lib/types";

export interface PreparedQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

const LIVES = 3;

export default function PlayGameClient({
  studentName,
  teamName,
  theme,
  courseName,
  weekLabel,
  showExplanation,
  questions,
}: {
  studentName: string;
  teamName: string | null;
  theme: string;
  courseName: string;
  weekLabel: string;
  showExplanation: boolean;
  questions: PreparedQuestion[];
}) {
  const colors = useMemo(() => themeColors(theme), [theme]);

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [log, setLog] = useState<AttemptDetail[]>([]);

  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");

  const finished = index >= questions.length || gameOver;
  const q = !finished ? questions[index] : null;
  const isSuper = streak >= 3;

  function onChoiceClick(i: number) {
    if (!q || answered) return;
    setAnswered(true);
    setChosenIndex(i);

    const correct = i === q.correctIndex;
    const wasSuper = streak >= 3;

    if (correct) {
      setScore((s) => s + (wasSuper ? 2 : 1));
      setStreak((s) => s + 1);
      playCorrectSound(theme);
    } else {
      playLifeLostSound(theme);
      setStreak(0);
      setLives((l) => {
        const next = l - 1;
        if (next <= 0) setGameOver(true);
        return next;
      });
    }

    setLog((prev) => [
      ...prev,
      {
        prompt: q.prompt,
        chosenText: q.choices[i],
        correctText: q.choices[q.correctIndex],
        correct,
        explanation: q.explanation,
      },
    ]);
  }

  function nextQuestion() {
    setAnswered(false);
    setChosenIndex(null);
    setIndex((i) => i + 1);
  }

  async function submitResults() {
    setSubmitState("submitting");
    const correctCount = log.filter((d) => d.correct).length;
    try {
      const res = await fetch("/api/play/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          score,
          total: log.length,
          correctCount,
          details: log,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitState("done");
    } catch {
      setSubmitState("error");
    }
  }

  const containerStyle = {
    background: colors.bg,
    color: colors.text,
    minHeight: "100vh",
  };

  if (finished) {
    const correctCount = log.filter((d) => d.correct).length;
    const missed = log.filter((d) => !d.correct);
    return (
      <div style={containerStyle} className="px-4 py-8">
        <div
          className="mx-auto max-w-md space-y-4 rounded-xl border p-6"
          style={{ background: colors.panel, borderColor: colors.panelEdge }}
        >
          <h1
            className="text-2xl font-black"
            style={{ color: colors.yellow }}
          >
            {gameOver ? "GAME OVER" : "ROUND COMPLETE"}
          </h1>
          <p className="text-lg">
            Score: <span style={{ color: colors.green }}>{score}</span>
          </p>
          <p className="text-sm" style={{ color: colors.muted }}>
            {correctCount}/{log.length} correct
          </p>

          {missed.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-semibold" style={{ color: colors.pink }}>
                Review
              </p>
              {missed.map((d, i) => (
                <div
                  key={i}
                  className="rounded-md border p-2 text-xs"
                  style={{ borderColor: colors.panelEdge }}
                >
                  <p>{d.prompt}</p>
                  <p style={{ color: colors.red }}>Your answer: {d.chosenText}</p>
                  <p style={{ color: colors.green }}>Correct: {d.correctText}</p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            {submitState === "idle" && (
              <button
                onClick={submitResults}
                className="w-full rounded-md px-4 py-2 font-semibold text-black"
                style={{ background: colors.yellow }}
              >
                Submit results
              </button>
            )}
            {submitState === "submitting" && (
              <p className="text-sm" style={{ color: colors.muted }}>
                Submitting…
              </p>
            )}
            {submitState === "done" && (
              <p className="text-sm font-semibold" style={{ color: colors.green }}>
                Submitted! Ask your teacher to show the results.
              </p>
            )}
            {submitState === "error" && (
              <div className="space-y-2">
                <p className="text-sm" style={{ color: colors.red }}>
                  Couldn&apos;t submit — try again.
                </p>
                <button
                  onClick={submitResults}
                  className="w-full rounded-md px-4 py-2 font-semibold text-black"
                  style={{ background: colors.yellow }}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} className="px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: colors.muted }}>
            {studentName}
            {teamName ? ` · ${teamName}` : ""}
          </span>
          <span style={{ color: colors.muted }}>
            {courseName} — {weekLabel}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold" style={{ color: colors.green }}>
            Score: {score}
          </span>
          <span className="text-lg" style={{ color: colors.red }}>
            {"♥".repeat(Math.max(0, lives))}
            {"♡".repeat(Math.max(0, LIVES - lives))}
          </span>
        </div>

        {isSuper && (
          <div
            className="rounded-md px-3 py-1 text-center text-sm font-black"
            style={{ background: colors.pink, color: colors.bg }}
          >
            SUPER! x2
          </div>
        )}

        <div
          className="rounded-xl border p-5"
          style={{ background: colors.panel, borderColor: colors.panelEdge }}
        >
          <p className="mb-4 text-sm" style={{ color: colors.muted }}>
            Q{index + 1}/{questions.length}
          </p>
          <p className="mb-5 text-lg font-semibold">{q!.prompt}</p>

          <div
            className={
              q!.type === "tf" ? "grid grid-cols-2 gap-3" : "grid gap-3"
            }
          >
            {q!.choices.map((choice, i) => {
              let bg = colors.bg;
              let border = colors.panelEdge;
              if (answered && i === q!.correctIndex) {
                bg = colors.green;
                border = colors.green;
              } else if (answered && i === chosenIndex) {
                bg = colors.red;
                border = colors.red;
              }
              return (
                <button
                  key={i}
                  onClick={() => onChoiceClick(i)}
                  disabled={answered}
                  className="rounded-md border px-4 py-3 text-left font-medium transition disabled:cursor-default"
                  style={{
                    background: bg,
                    borderColor: border,
                    color:
                      answered && (i === q!.correctIndex || i === chosenIndex)
                        ? colors.bg
                        : colors.text,
                  }}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          {answered && showExplanation && q!.explanation && (
            <div
              className="mt-4 rounded-md border p-3 text-sm"
              style={{ borderColor: colors.panelEdge, color: colors.cyan }}
            >
              <span className="mr-2 font-bold">
                {chosenIndex === q!.correctIndex ? "CORRECT!" : "EXPLANATION"}
              </span>
              {q!.explanation}
            </div>
          )}

          {answered && (
            <button
              onClick={nextQuestion}
              className="mt-4 w-full rounded-md px-4 py-2 font-semibold text-black"
              style={{ background: colors.yellow }}
            >
              {index + 1 >= questions.length || gameOver ? "Finish" : "Next"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
