import type { SessionResults } from "@/lib/session-results";

const THEME_LABELS: Record<string, string> = {
  pac: "PAC",
  blocks: "BLOCKS",
  plumber: "PLUMBER",
};

export default function SessionResultsView({
  results,
}: {
  results: SessionResults;
}) {
  const { session, courseName, weekLabel, individual, teams } = results;
  const topTeamId = teams && teams.length > 0 ? teams[0].teamId : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-400">
          {courseName} — {weekLabel} · {THEME_LABELS[session.theme] ?? session.theme} ·{" "}
          {session.mode} mode · code {session.session_code}
        </p>
      </div>

      {individual.length === 0 && (
        <p className="text-sm text-slate-500">
          No one has submitted results for this session yet.
        </p>
      )}

      {teams && teams.length > 0 && (
        <div>
          <h3 className="mb-2 text-lg font-bold text-slate-100">
            Team leaderboard
          </h3>
          <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
            {teams.map((t, i) => (
              <li
                key={t.teamId}
                className={`flex items-center justify-between px-4 py-3 ${
                  t.teamId === topTeamId
                    ? "bg-gradient-to-r from-indigo-950/60 to-transparent"
                    : ""
                }`}
              >
                <span className="flex items-center gap-2 text-slate-100">
                  <span className="text-xs text-slate-500">#{i + 1}</span>
                  {t.teamId === topTeamId && <span>🏆</span>}
                  {t.name}
                  <span className="text-xs text-slate-500">
                    ({t.memberCount} player{t.memberCount === 1 ? "" : "s"})
                  </span>
                </span>
                <span className="font-bold text-indigo-400">
                  {t.totalScore}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-lg font-bold text-slate-100">
          Individual leaderboard
        </h3>
        <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
          {individual.map((r, i) => (
            <li
              key={r.studentId}
              className={`flex items-center justify-between px-4 py-3 ${
                i === 0 ? "bg-gradient-to-r from-indigo-950/60 to-transparent" : ""
              }`}
            >
              <span className="flex items-center gap-2 text-slate-100">
                <span className="text-xs text-slate-500">#{i + 1}</span>
                {i === 0 && <span>🏆</span>}
                {r.name}
                {r.teamName && (
                  <span className="text-xs text-slate-500">{r.teamName}</span>
                )}
              </span>
              <span className="text-sm text-slate-400">
                <span className="font-bold text-indigo-400">{r.score}</span>{" "}
                pts · {r.correctCount}/{r.total} correct
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
