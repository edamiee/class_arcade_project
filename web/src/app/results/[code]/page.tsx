import { notFound } from "next/navigation";
import { getSessionResultsByCode } from "@/lib/session-results";
import SessionResultsView from "@/components/session-results-view";

export default async function PublicResultsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const results = await getSessionResultsByCode(code);
  if (!results) notFound();

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Results</h1>
        <SessionResultsView results={results} />
      </div>
    </div>
  );
}
