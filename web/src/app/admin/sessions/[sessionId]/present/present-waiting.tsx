import { MascotHeader } from "@/components/mascot";
import ChaseStrip from "@/components/chase-strip";
import JoinQrCode from "@/components/join-qr-code";

const THEME_LABELS: Record<string, string> = {
  pac: "PAC",
  blocks: "BLOCKS",
  plumber: "PLUMBER",
};

// The "come join us" screen — today's entire /present page for self-paced
// sessions, and the pre-"Start round" state for presenter-paced ones.
// Extracted so both can share it verbatim instead of duplicating the QR
// code + big session code layout.
export default function PresentWaiting({
  theme,
  courseName,
  weekLabel,
  sessionCode,
  joinUrl,
}: {
  theme: string;
  courseName: string;
  weekLabel: string;
  sessionCode: string;
  joinUrl: string;
}) {
  return (
    <div
      data-theme={theme}
      className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-4 py-8 text-center"
    >
      <div className="flex flex-col items-center gap-3">
        <MascotHeader />
        <h1 className="brand-marquee text-2xl font-bold">
          Penelope&apos;s Learning Arcade
        </h1>
        <p className="text-sm text-slate-400">
          {courseName} — {weekLabel} · {THEME_LABELS[theme] ?? theme}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-10">
        <JoinQrCode url={joinUrl} size={240} />
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            Session code
          </p>
          <p className="text-7xl font-black tracking-widest text-indigo-400">
            {sessionCode}
          </p>
        </div>
      </div>

      <p className="text-lg text-slate-300">
        Scan the code, or go to <span className="text-slate-100">/join</span>{" "}
        and enter it.
      </p>

      <div className="w-full max-w-md">
        <ChaseStrip theme={theme} />
      </div>
    </div>
  );
}
