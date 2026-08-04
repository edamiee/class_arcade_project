import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionResultsById } from "@/lib/session-results";
import { getSessionQuestionStats } from "@/lib/session-question-stats";
import SessionResultsView from "@/components/session-results-view";
import SessionQuestionChart from "@/components/session-question-chart";
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm text-slate-400 hover:text-indigo-400"
          >
            ← Dashboard
          </Link>
          <h2 className="text-2xl font-bold">Session results</h2>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/admin/sessions/${sessionId}/live`}
            className="rounded-md border-2 border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500"
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
        <h3 className="mb-2 text-lg font-bold text-slate-100">
          Per-question results
        </h3>
        <SessionQuestionChart theme={results.session.theme} stats={questionStats} />
      </div>
    </div>
  );
}
