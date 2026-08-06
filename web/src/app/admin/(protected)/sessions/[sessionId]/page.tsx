import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionResultsById } from "@/lib/session-results";
import { getSessionQuestionStats } from "@/lib/session-question-stats";
import SessionResultsView from "@/components/session-results-view";
import SessionQuestionChart from "@/components/session-question-chart";
import { TrophyIcon } from "@/components/dashboard-icons";
import EndSessionButton from "./end-session-button";

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const results = await getSessionResultsById(sessionId);
  if (!results) notFound();

  const questionStats = await getSessionQuestionStats(sessionId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin"
            className="text-sm text-slate-400 hover:text-indigo-400"
          >
            ← Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="dc-icon">
              <TrophyIcon />
            </span>
            <h2 className="brand-marquee text-2xl font-bold">Session results</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <a
            href={`/admin/sessions/${sessionId}/present`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border-2 border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-[var(--cyan)]"
          >
            Present for class
          </a>
          <Link
            href={`/admin/sessions/${sessionId}/live`}
            className="rounded-md border-2 border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-[var(--cyan)]"
          >
            Watch live
          </Link>
          <EndSessionButton
            sessionId={sessionId}
            isOpen={results.session.is_open}
          />
        </div>
      </div>
      <SessionResultsView results={results} showAdminActions />

      <div>
        <h3 className="mb-2 text-lg font-bold" style={{ color: "var(--cyan)" }}>
          Per-question results
        </h3>
        <div className="arcade-bezel p-4">
          <SessionQuestionChart theme={results.session.theme} stats={questionStats} />
        </div>
      </div>
    </div>
  );
}
