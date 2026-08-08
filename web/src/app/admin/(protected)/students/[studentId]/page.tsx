import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentProgress } from "@/lib/student-progress";
import StudentProgressView from "@/components/student-progress-view";
import { PeopleIcon } from "@/components/dashboard-icons";

export default async function StudentProgressPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const progress = await getStudentProgress(studentId);
  if (!progress) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/students"
          className="text-sm text-slate-400 hover:text-indigo-400"
        >
          ← Students
        </Link>
        <div className="flex items-center gap-3">
          <span className="dc-icon">
            <PeopleIcon />
          </span>
          <h2 className="brand-marquee text-2xl font-bold">
            {progress.student.name}
          </h2>
        </div>
      </div>
      <p className="text-sm text-slate-400">
        Every week this student has played, grouped in the order they first
        tried it, with each attempt&apos;s correct/total shown in order —
        best attempt highlighted.
      </p>
      <StudentProgressView weeks={progress.weeks} />
    </div>
  );
}
