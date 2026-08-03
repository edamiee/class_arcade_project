import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionResultsById } from "@/lib/session-results";
import SessionResultsView from "@/components/session-results-view";
import EndSessionButton from "./end-session-button";

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const results = await getSessionResultsById(sessionId);
  if (!results) notFound();

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
        <EndSessionButton
          sessionId={sessionId}
          isOpen={results.session.is_open}
        />
      </div>
      <SessionResultsView results={results} />
    </div>
  );
}
