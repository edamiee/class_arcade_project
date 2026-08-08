import type { StudentWeekProgress } from "@/lib/student-progress";

function badgeClasses(pct: number): string {
  if (pct >= 80) return "bg-emerald-950 text-emerald-400";
  if (pct >= 50) return "bg-amber-950 text-amber-400";
  return "bg-red-950 text-red-400";
}

// Same chronological score-chip pattern as practice-progress-view.tsx (best
// attempt highlighted), one row per week instead of per student, so a
// teacher scanning top-to-bottom sees the class content in the order it
// was taught and can spot which weeks are still shaky.
export default function StudentProgressView({
  weeks,
}: {
  weeks: StudentWeekProgress[];
}) {
  if (weeks.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        This student hasn&apos;t played any sessions yet.
      </p>
    );
  }

  return (
    <ul className="arcade-bezel divide-y divide-slate-800">
      {weeks.map((w) => {
        const bestAttempt = w.attempts.reduce((best, a) => {
          const pct = a.total > 0 ? (a.correctCount / a.total) * 100 : 0;
          const bestPct = best.total > 0 ? (best.correctCount / best.total) * 100 : 0;
          return pct > bestPct ? a : best;
        }, w.attempts[0]);

        return (
          <li key={`${w.courseName}::${w.weekLabel}`} className="space-y-2 px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div>
                <span className="text-slate-100">{w.weekLabel}</span>
                <span className="ml-2 text-xs text-slate-500">{w.courseName}</span>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs font-semibold ${badgeClasses(w.bestPct)}`}
              >
                best {Math.round(w.bestPct)}%
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {w.attempts.map((a) => (
                <span
                  key={a.attemptId}
                  title={new Date(a.playedAt).toLocaleString()}
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    a === bestAttempt
                      ? "bg-emerald-950 font-semibold text-emerald-400"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {a.correctCount}/{a.total}
                </span>
              ))}
              {w.attempts.length > 1 && (
                <span className="text-xs text-slate-600">(oldest → newest)</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
