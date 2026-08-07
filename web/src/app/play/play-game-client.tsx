"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { themeColors } from "@/lib/theme-colors";
import { playCorrectSound, playLifeLostSound } from "@/lib/sound";
import { MascotEnd } from "@/components/mascot";
import LifeIcon from "@/components/life-icon";
import JoystickIcon from "@/components/joystick-icon";
import SoundToggleButton from "@/components/sound-toggle-button";
import type {
  AttemptDetail,
  ExplanationMode,
  PreparedQuestion,
  SessionPacing,
} from "@/lib/types";

const LIVES = 3;
const PRESENTER_POLL_MS = 1500;

export default function PlayGameClient({
  studentName,
  teamName,
  theme,
  courseName,
  weekLabel,
  explanationMode,
  sessionCode,
  timerSeconds,
  questions: initialQuestions,
  pacing,
  initialIndex,
  initialQuestionStartedAt,
  isPractice,
}: {
  studentName: string;
  teamName: string | null;
  theme: string;
  courseName: string;
  weekLabel: string;
  explanationMode: ExplanationMode;
  sessionCode: string;
  timerSeconds: number;
  questions: PreparedQuestion[];
  pacing: SessionPacing;
  initialIndex: number;
  initialQuestionStartedAt: string | null;
  isPractice: boolean;
}) {
  const router = useRouter();
  const colors = useMemo(() => themeColors(theme), [theme]);
  const isPresenter = pacing === "presenter";

  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(initialIndex);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [log, setLog] = useState<AttemptDetail[]>([]);
  const [timerRemaining, setTimerRemaining] = useState(timerSeconds);
  const [questionStartedAt, setQuestionStartedAt] = useState(
    initialQuestionStartedAt
  );
  const [sessionEnded, setSessionEnded] = useState(false);

  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");

  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const lobby = isPresenter && index < 0;
  const finished = !lobby && (index >= questions.length || gameOver || sessionEnded);
  const q = !lobby && !finished ? questions[index] : null;
  const isSuper = streak >= 3;

  function goToQuestion(newIndex: number) {
    setAnswered(false);
    setChosenIndex(null);
    setIndex(newIndex);
  }

  // Presenter-paced only: the teacher's "Next question" click on /live is
  // the sole source of truth for advancing — this poll just finds out
  // about it. Always syncs directly to the server's index (never
  // increments locally) so a missed tick can't cause permanent drift.
  useEffect(() => {
    if (!isPresenter) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/play/session-status");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;

        if (Array.isArray(data.questionOrder) && data.questionOrder.length > 0) {
          setQuestions(data.questionOrder);
        }
        setQuestionStartedAt(data.questionStartedAt ?? null);

        if (!data.isOpen) {
          setSessionEnded(true);
          return;
        }
        if (
          typeof data.currentQuestionIndex === "number" &&
          data.currentQuestionIndex !== indexRef.current
        ) {
          goToQuestion(data.currentQuestionIndex);
        }
      } catch {
        // Transient network error — the next poll tick retries.
      }
    }

    poll();
    const interval = setInterval(poll, PRESENTER_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresenter]);

  function recordAnswer(i: number | null) {
    if (!q || answered) return;
    setAnswered(true);
    setChosenIndex(i);

    const correct = i !== null && i === q.correctIndex;
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

    const chosenText = i === null ? "(no answer — time ran out)" : q.choices[i];
    const correctText = q.choices[q.correctIndex];

    setLog((prev) => [
      ...prev,
      { prompt: q.prompt, chosenText, correctText, correct, explanation: q.explanation },
    ]);

    // Fire-and-forget: powers the admin live feed / per-question chart.
    // Must never block or break gameplay if it fails.
    fetch("/api/play/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        questionId: q.id,
        prompt: q.prompt,
        chosenText,
        correctText,
        correct,
      }),
    }).catch(() => {});
  }

  function onChoiceClick(i: number) {
    recordAnswer(i);
  }

  // Per-question countdown. Restarts on every new question and stops as
  // soon as the question is answered (manually or by timing out) — keyed
  // on `answered` too so the interval from a question the player already
  // answered can never fire a stale expiry against the next question. In
  // presenter mode the countdown is anchored to the shared
  // `questionStartedAt` timestamp instead of this browser's own clock, so
  // a laggy poll can't desync one student's timer from the rest of the
  // class — expiry still only records *this* student's no-answer, it
  // never advances the class (that's the teacher's action alone).
  useEffect(() => {
    if (!q || timerSeconds <= 0 || answered) return;
    const start =
      isPresenter && questionStartedAt
        ? new Date(questionStartedAt).getTime()
        : Date.now();
    setTimerRemaining(Math.max(0, timerSeconds - (Date.now() - start) / 1000));
    const interval = setInterval(() => {
      const remaining = timerSeconds - (Date.now() - start) / 1000;
      if (remaining <= 0) {
        setTimerRemaining(0);
        clearInterval(interval);
        recordAnswer(null);
      } else {
        setTimerRemaining(remaining);
      }
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, timerSeconds, answered, questionStartedAt]);

  function nextQuestion() {
    goToQuestion(index + 1);
  }

  function quit() {
    if (!confirm("Quit this game? Progress will be lost.")) return;
    router.push("/join");
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

  if (lobby) {
    return (
      <div style={containerStyle} data-theme={theme} className="px-4 py-8">
        <div className="arcade-bezel mx-auto max-w-md space-y-4 rounded-xl p-6 text-center">
          <h1 className="text-2xl font-black" style={{ color: colors.yellow }}>
            GET READY
          </h1>
          <div className="flex justify-center">
            <MascotEnd />
          </div>
          <p className="text-sm" style={{ color: colors.muted }}>
            Waiting for your teacher to start the round…
          </p>
          <p className="text-xs" style={{ color: colors.muted }}>
            {studentName}
            {teamName ? ` · ${teamName}` : ""} — {courseName} — {weekLabel}
          </p>
        </div>
      </div>
    );
  }

  if (finished) {
    const correctCount = log.filter((d) => d.correct).length;
    const missed = log.filter((d) => !d.correct);
    return (
      <div style={containerStyle} data-theme={theme} className="px-4 py-8">
        <div className="arcade-bezel mx-auto max-w-md space-y-4 rounded-xl p-6">
          <h1
            className="text-2xl font-black"
            style={{ color: colors.yellow }}
          >
            {gameOver ? "GAME OVER" : "ROUND COMPLETE"}
          </h1>
          <div className="flex justify-center">
            <MascotEnd />
          </div>
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
                  className="rounded-md border-2 p-2 text-xs"
                  style={{ borderColor: colors.panelEdge }}
                >
                  <p>{d.prompt}</p>
                  <p style={{ color: colors.red }}>Your answer: {d.chosenText}</p>
                  <p style={{ color: colors.green }}>Correct: {d.correctText}</p>
                  {explanationMode !== "off" && d.explanation && (
                    <p className="mt-1" style={{ color: colors.cyan }}>
                      {d.explanation}
                    </p>
                  )}
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
              <div className="space-y-2">
                <p className="text-sm font-semibold" style={{ color: colors.green }}>
                  Submitted!
                </p>
                <a
                  href={`/results/${sessionCode}`}
                  className="block w-full rounded-md px-4 py-2 text-center font-semibold text-black"
                  style={{ background: colors.yellow }}
                >
                  View results
                </a>
                {isPractice && pacing === "self" && (
                  <a
                    href="/play"
                    className="block w-full rounded-md border-2 px-4 py-2 text-center font-semibold"
                    style={{ borderColor: colors.panelEdge, color: colors.text }}
                  >
                    Play again
                  </a>
                )}
              </div>
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

  const timerPct = timerSeconds > 0 ? Math.max(0, (timerRemaining / timerSeconds) * 100) : 0;
  const timerLow = timerPct <= 25;

  return (
    <div style={containerStyle} data-theme={theme} className="px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <div className="space-y-0.5 text-sm" style={{ color: colors.muted }}>
          <p>
            {studentName}
            {teamName ? ` · ${teamName}` : ""}
          </p>
          <p>
            {courseName} — {weekLabel}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="score-readout">
            <span className="score-label">SCORE</span>
            <span className="score-digits">{String(score).padStart(5, "0")}</span>
          </div>
          <span className="flex gap-1.5">
            {Array.from({ length: LIVES }, (_, i) => (
              <LifeIcon key={i} lost={i >= lives} />
            ))}
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

        <div className="arcade-bezel rounded-xl p-5">
          <p className="mb-4 text-sm" style={{ color: colors.muted }}>
            Q{index + 1}/{questions.length}
          </p>

          {timerSeconds > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <div
                className="h-3 flex-1 overflow-hidden border-2"
                style={{ background: colors.bg, borderColor: colors.panelEdge }}
              >
                <div
                  className="h-full transition-[width]"
                  style={{
                    width: `${timerPct}%`,
                    background: timerLow ? colors.red : colors.yellow,
                  }}
                />
              </div>
              <span className="text-xs font-bold" style={{ color: colors.yellow }}>
                {Math.ceil(Math.max(0, timerRemaining))}s
              </span>
            </div>
          )}

          <p className="mb-5 text-lg font-semibold">{q!.prompt}</p>

          <div
            className={
              q!.type === "tf" ? "grid grid-cols-2 gap-3" : "grid gap-3"
            }
          >
            {q!.choices.map((choice, i) => {
              let bg = colors.bg;
              let borderColor = colors.panelEdge;
              if (answered && i === q!.correctIndex) {
                bg = colors.green;
                borderColor = colors.green;
              } else if (answered && i === chosenIndex) {
                bg = colors.red;
                borderColor = colors.red;
              }
              return (
                <button
                  key={i}
                  onClick={() => onChoiceClick(i)}
                  disabled={answered}
                  className="rounded-md border-2 px-4 py-3 text-left font-medium transition disabled:cursor-default"
                  style={{
                    background: bg,
                    borderColor: borderColor,
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

          {answered && explanationMode === "immediate" && q!.explanation && (
            <div
              className="mt-4 rounded-md border-2 p-3 text-sm"
              style={{ borderColor: colors.panelEdge, color: colors.cyan }}
            >
              <span className="mr-2 font-bold">
                {chosenIndex === null
                  ? "TIME'S UP!"
                  : chosenIndex === q!.correctIndex
                    ? "CORRECT!"
                    : "EXPLANATION"}
              </span>
              {q!.explanation}
            </div>
          )}

          {answered && isPresenter && (
            <p
              className="mt-4 text-center text-sm"
              style={{ color: colors.muted }}
            >
              Waiting for the rest of the class…
            </p>
          )}

          {answered && !isPresenter && (
            <button
              onClick={nextQuestion}
              className="mt-4 w-full rounded-md px-4 py-2 font-semibold text-black"
              style={{ background: colors.yellow }}
            >
              {index + 1 >= questions.length || gameOver ? "Finish" : "Next"}
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <SoundToggleButton borderColor={colors.panelEdge} color={colors.muted} />
          <JoystickIcon />
          <button
            onClick={quit}
            className="text-xs underline"
            style={{ color: colors.muted }}
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}
