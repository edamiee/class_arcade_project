import type { SessionResults } from "@/lib/session-results";
import ChaseStrip from "@/components/chase-strip";

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
    <div data-theme={session.theme} className="space-y-6">
      <div>
        <p className="text-sm text-slate-400">
          {courseName} — {weekLabel} · {THEME_LABELS[session.theme] ?? session.theme} ·{" "}
          {session.mode} mode · code {session.session_code}
        </p>
      </div>

      <ChaseStrip theme={session.theme} />

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
          <ul className="divide-y-2 divide-slate-800 rounded-lg border-2 border-slate-800">
            {teams.map((t, i) => (
              <li
                key={t.teamId}
                className={`flex items-center justify-between px-4 py-3 ${
                  t.teamId === topTeamId ? "winner-badge" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={
                      t.teamId === topTeamId
                        ? "text-xs"
                        : "text-xs text-slate-500"
                    }
                  >
                    #{i + 1}
                  </span>
                  {t.teamId === topTeamId && <span>🏆</span>}
                  <span
                    className={
                      t.teamId === topTeamId
                        ? "font-bold"
                        : "text-slate-100"
                    }
                  >
                    {t.name}
                  </span>
                  <span
                    className={
                      t.teamId === topTeamId
                        ? "text-xs"
                        : "text-xs text-slate-500"
                    }
                  >
                    ({t.memberCount} player{t.memberCount === 1 ? "" : "s"})
                  </span>
                </span>
                <span
                  className="text-xl font-black"
                  style={
                    t.teamId === topTeamId
                      ? undefined
                      : {
                          color: "var(--yellow)",
                          textShadow: "0 0 8px rgba(255,212,0,0.7)",
                        }
                  }
                >
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
        <ul className="divide-y-2 divide-slate-800 rounded-lg border-2 border-slate-800">
          {individual.map((r, i) => (
            <li
              key={r.studentId}
              className={`flex items-center justify-between px-4 py-3 ${
                i === 0 ? "winner-badge" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={i === 0 ? "text-xs" : "text-xs text-slate-500"}>
                  #{i + 1}
                </span>
                {i === 0 && <span>🏆</span>}
                <span className={i === 0 ? "font-bold" : "text-slate-100"}>
                  {r.name}
                </span>
                {r.teamName && (
                  <span className={i === 0 ? "text-xs" : "text-xs text-slate-500"}>
                    {r.teamName}
                  </span>
                )}
              </span>
              <span
                className={
                  i === 0
                    ? "text-sm font-bold"
                    : "text-sm text-slate-400"
                }
              >
                <span
                  className="text-xl font-black"
                  style={
                    i === 0
                      ? undefined
                      : {
                          color: "var(--yellow)",
                          textShadow: "0 0 8px rgba(255,212,0,0.7)",
                        }
                  }
                >
                  {r.score}
                </span>{" "}
                pts · {r.correctCount}/{r.total} correct
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
