import type { WeekMissSummary } from "@/lib/miss-analysis";

// Same aggregation the AI teaching-tips generator already computes
// (getWeekMissSummary), just shown directly — no AI call needed to see
// which questions trip students up across every session ever launched
// for this week.
export default function MissedQuestionsPanel({
  summary,
}: {
  summary: WeekMissSummary;
}) {
  if (summary.attemptCount === 0) {
    return (
      <p className="text-sm text-slate-500">
        No attempts recorded yet for this week.
      </p>
    );
  }

  if (summary.questions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No missed questions across {summary.attemptCount} attempt
        {summary.attemptCount === 1 ? "" : "s"} — nice!
      </p>
    );
  }

  return (
    <ul className="arcade-bezel divide-y divide-slate-800">
      {summary.questions.map((q, i) => (
        <li key={i} className="space-y-1 px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm text-slate-100">{q.prompt}</p>
            <span className="shrink-0 text-xs font-semibold text-red-400">
              missed {q.missCount}/{q.attemptCount}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Correct: <span className="text-emerald-400">{q.correctText}</span>
          </p>
          {q.sampleWrongAnswers.length > 0 && (
            <p className="text-xs text-slate-500">
              Common wrong answers: {q.sampleWrongAnswers.join(", ")}
            </p>
          )}
          {q.explanation && (
            <p className="text-xs italic text-slate-500">{q.explanation}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
