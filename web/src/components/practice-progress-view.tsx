import type { PracticeProgressStudent } from "@/lib/practice-progress";

// Each student's attempts rendered as a chronological sequence of score
// chips (oldest → newest) — no charting library, matching the hand-built
// approach already used for the per-question bar chart
// (session-question-chart.tsx). The point is just "are they trending up,"
// not precision.
export default function PracticeProgressView({
  students,
}: {
  students: PracticeProgressStudent[];
}) {
  if (students.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No one has practiced this session yet.
      </p>
    );
  }

  return (
    <ul className="arcade-bezel divide-y divide-slate-800">
      {students.map((s) => (
        <li key={s.studentId} className="space-y-2 px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-slate-100">{s.name}</span>
            <span className="text-xs text-slate-500">
              {s.attemptCount} attempt{s.attemptCount === 1 ? "" : "s"} · best{" "}
              <span className="font-semibold" style={{ color: "var(--yellow)" }}>
                {s.bestScore}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {s.attempts.map((a, i) => (
              <span
                key={a.attemptId}
                title={new Date(a.playedAt).toLocaleString()}
                className={`rounded px-1.5 py-0.5 text-xs ${
                  a.score === s.bestScore
                    ? "bg-emerald-950 font-semibold text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {a.score}
              </span>
            ))}
            {s.attempts.length > 1 && (
              <span className="text-xs text-slate-600">
                (oldest → newest)
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
