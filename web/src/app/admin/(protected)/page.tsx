import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ChaseStrip from "@/components/chase-strip";
import JoystickIcon from "@/components/joystick-icon";
import { BookIcon, ClockIcon, PeopleIcon, ShieldIcon } from "@/components/dashboard-icons";

function StatReadout({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-readout">
      <span className="score-label">{label}</span>
      <span className="score-digits">{String(value).padStart(2, "0")}</span>
    </div>
  );
}

function NavCard({
  href,
  icon,
  label,
  desc,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`arcade-bezel dashboard-card${primary ? " primary" : ""}`}
    >
      <span className="dc-icon">{icon}</span>
      <span className="dc-label">{label}</span>
      <span className="dc-desc">{desc}</span>
    </Link>
  );
}

export default async function AdminHomePage() {
  const supabase = await createClient();
  const [{ data: courses }, { data: sessions }, { data: students }] =
    await Promise.all([
      supabase.from("courses").select("id"),
      supabase.from("sessions").select("id, is_open"),
      supabase.from("students").select("id"),
    ]);

  const courseCount = courses?.length ?? 0;
  const liveSessionCount = (sessions ?? []).filter((s) => s.is_open).length;
  const studentCount = students?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="brand-marquee text-2xl font-bold">Dashboard</h2>
        <ChaseStrip theme="pac" />
      </div>

      <div className="flex flex-wrap gap-4">
        <StatReadout label="COURSES" value={courseCount} />
        <StatReadout label="LIVE NOW" value={liveSessionCount} />
        <StatReadout label="STUDENTS" value={studentCount} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <NavCard
          href="/admin/sessions/new"
          icon={<JoystickIcon />}
          label="Launch a session"
          desc="Start a live round"
          primary
        />
        <NavCard
          href="/admin/courses"
          icon={<BookIcon />}
          label="Manage courses"
          desc="Weeks & questions"
        />
        <NavCard
          href="/admin/sessions"
          icon={<ClockIcon />}
          label="Sessions history"
          desc="Past & live sessions"
        />
        <NavCard
          href="/admin/students"
          icon={<PeopleIcon />}
          label="Students"
          desc="Roster & scores"
        />
        <NavCard
          href="/admin/admins"
          icon={<ShieldIcon />}
          label="Admins"
          desc="Manage access"
        />
      </div>
    </div>
  );
}
