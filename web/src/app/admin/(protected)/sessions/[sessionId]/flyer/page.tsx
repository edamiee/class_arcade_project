import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSessionResultsById } from "@/lib/session-results";
import JoinQrCode from "@/components/join-qr-code";
import PrintButton from "@/components/print-button";

// Same plain black-on-white, system-font convention as the week's
// "Print Q&A" page (.../weeks/[weekId]/print/page.tsx) — meant to
// actually go through a printer and get posted/handed out, so it
// deliberately doesn't use the dark arcade theme. Lives inside the
// (protected) group (unlike /present, which stays outside it to avoid
// ever projecting admin chrome) since this is only ever viewed on the
// admin's own screen before printing, never shown to students.
export default async function PracticeFlyerPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const results = await getSessionResultsById(sessionId);
  if (!results) notFound();

  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const joinUrl = `${origin}/join?code=${results.session.session_code}`;

  return (
    <div
      className="min-h-screen bg-white px-8 py-8 text-center text-black"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print mb-6 flex items-center justify-between text-left">
        <a href="../" className="text-sm text-gray-600 underline">
          ← Back
        </a>
        <PrintButton />
      </div>

      <h1 className="text-2xl font-bold">
        {results.courseName} — {results.weekLabel}
      </h1>
      <p className="mt-1 text-gray-600">Practice anytime — no time limit</p>

      <div className="mt-8 flex justify-center">
        <JoinQrCode url={joinUrl} size={280} />
      </div>

      <p className="mt-6 text-sm uppercase tracking-wide text-gray-500">
        Session code
      </p>
      <p className="text-6xl font-black tracking-widest">
        {results.session.session_code}
      </p>

      <p className="mx-auto mt-8 max-w-sm text-gray-600">
        Scan the code, or go to <strong>{origin}/join</strong> and enter it.
        Play as many times as you want to review before the test.
      </p>
    </div>
  );
}
