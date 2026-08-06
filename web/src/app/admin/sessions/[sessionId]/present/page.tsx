import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, GameSession, Week } from "@/lib/types";
import { MascotHeader } from "@/components/mascot";
import ChaseStrip from "@/components/chase-strip";
import JoinQrCode from "@/components/join-qr-code";

const THEME_LABELS: Record<string, string> = {
  pac: "PAC",
  blocks: "BLOCKS",
  plumber: "PLUMBER",
};

// Deliberately outside the (protected) route group: that layout renders
// the admin's email + Log out button in a header, which would otherwise
// end up on this screen when it's projected for the whole class to see.
// Auth is still required — checked manually here, same two-step pattern
// as (protected)/layout.tsx (logged in, and present in public.admins).
export default async function PresentSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: adminRow } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!adminRow) redirect("/admin/login?error=not_admin");

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) notFound();
  const typedSession = session as GameSession;

  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const [{ data: course }, { data: week }] = await Promise.all([
    supabase
      .from("courses")
      .select("name")
      .eq("id", typedSession.course_id)
      .maybeSingle(),
    supabase
      .from("weeks")
      .select("label")
      .eq("id", typedSession.week_id)
      .maybeSingle(),
  ]);

  return (
    <div
      data-theme={typedSession.theme}
      className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-4 py-8 text-center"
    >
      <div className="flex flex-col items-center gap-3">
        <MascotHeader />
        <h1 className="brand-marquee text-2xl font-bold">
          Penelope&apos;s Learning Arcade
        </h1>
        <p className="text-sm text-slate-400">
          {(course as Course | null)?.name} — {(week as Week | null)?.label} ·{" "}
          {THEME_LABELS[typedSession.theme] ?? typedSession.theme}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-10">
        <JoinQrCode
          url={`${origin}/join?code=${typedSession.session_code}`}
          size={240}
        />
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            Session code
          </p>
          <p className="text-7xl font-black tracking-widest text-indigo-400">
            {typedSession.session_code}
          </p>
        </div>
      </div>

      <p className="text-lg text-slate-300">
        Scan the code, or go to <span className="text-slate-100">/join</span>{" "}
        and enter it.
      </p>

      <div className="w-full max-w-md">
        <ChaseStrip theme={typedSession.theme} />
      </div>
    </div>
  );
}
