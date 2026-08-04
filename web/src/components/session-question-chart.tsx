import type { QuestionStat } from "@/lib/session-question-stats";

// Hand-built bar chart (no charting library) matching the arcade theme —
// self-contained data-theme wrapper like ChaseStrip, so it colors
// correctly regardless of what theme the surrounding page defaults to.
export default function SessionQuestionChart({
  theme,
  stats,
}: {
  theme: string;
  stats: QuestionStat[];
}) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No answers recorded for this session yet.
      </p>
    );
  }

  return (
    <div data-theme={theme} className="space-y-3">
      {stats.map((s, i) => {
        const total = s.correctCount + s.wrongCount;
        const correctPct = total > 0 ? (s.correctCount / total) * 100 : 0;
        return (
          <div key={s.questionId}>
            <p className="mb-1 truncate text-sm text-slate-300">
              Q{i + 1}. {s.prompt}
            </p>
            <div className="flex h-5 overflow-hidden border-2 border-slate-800">
              {s.correctCount > 0 && (
                <div
                  className="h-full bg-[var(--green)]"
                  style={{ width: `${correctPct}%` }}
                />
              )}
              {s.wrongCount > 0 && (
                <div
                  className="h-full bg-[var(--red)]"
                  style={{ width: `${100 - correctPct}%` }}
                />
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {s.correctCount} correct · {s.wrongCount} wrong
            </p>
          </div>
        );
      })}
    </div>
  );
}
