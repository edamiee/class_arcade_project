import { notFound } from "next/navigation";
import { getSessionResultsByCode } from "@/lib/session-results";
import SessionResultsView from "@/components/session-results-view";
import { MascotHeader } from "@/components/mascot";

export default async function PublicResultsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const results = await getSessionResultsByCode(code);
  if (!results) notFound();

  return (
    <div
      data-theme={results.session.theme}
      className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100"
    >
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center gap-3">
          <MascotHeader />
          <h1 className="text-2xl font-bold">Results</h1>
        </div>
        {results.session.is_open ? (
          <SessionResultsView results={results} />
        ) : (
          <p className="text-sm text-slate-400">
            This session has ended. Ask your teacher for the results.
          </p>
        )}
      </div>
    </div>
  );
}
