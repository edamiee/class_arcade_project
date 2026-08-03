import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/courses"
          className="inline-block rounded-md bg-indigo-600 px-4 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500"
        >
          Manage courses
        </Link>
        <Link
          href="/admin/sessions/new"
          className="inline-block rounded-md border-2 border-slate-700 px-4 py-2 font-semibold text-slate-200 transition hover:border-slate-500"
        >
          Launch a session
        </Link>
        <Link
          href="/admin/sessions"
          className="inline-block rounded-md border-2 border-slate-700 px-4 py-2 font-semibold text-slate-200 transition hover:border-slate-500"
        >
          Sessions history
        </Link>
        <Link
          href="/admin/students"
          className="inline-block rounded-md border-2 border-slate-700 px-4 py-2 font-semibold text-slate-200 transition hover:border-slate-500"
        >
          Students
        </Link>
      </div>
    </div>
  );
}
