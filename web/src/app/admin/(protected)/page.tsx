import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <p className="text-slate-400">
        Results and sessions history will live here next.
      </p>
      <div className="flex gap-3">
        <Link
          href="/admin/courses"
          className="inline-block rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-500"
        >
          Manage courses
        </Link>
        <Link
          href="/admin/sessions/new"
          className="inline-block rounded-md border border-slate-700 px-4 py-2 font-semibold text-slate-200 transition hover:border-slate-500"
        >
          Launch a session
        </Link>
      </div>
    </div>
  );
}
