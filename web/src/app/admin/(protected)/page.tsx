import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <p className="text-slate-400">
        Session launching and results will live here next.
      </p>
      <Link
        href="/admin/courses"
        className="inline-block rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-500"
      >
        Manage courses
      </Link>
    </div>
  );
}
