import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWeekMissSummary } from "@/lib/miss-analysis";
import { QuizIcon } from "@/components/dashboard-icons";
import type { Course, Week, Question } from "@/lib/types";
import QuestionEditorClient from "./question-editor-client";
import TeachingTipsPanel from "./teaching-tips-panel";
import MissedQuestionsPanel from "@/components/missed-questions-panel";

export default async function WeekDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; weekId: string }>;
}) {
  const { courseId, weekId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  const { data: week } = await supabase
    .from("weeks")
    .select("*")
    .eq("id", weekId)
    .single();

  if (!course || !week) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("week_id", weekId)
    .order("created_at", { ascending: true });

  const missSummary = await getWeekMissSummary(weekId);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/admin/courses/${courseId}`}
            className="text-sm text-slate-400 hover:text-indigo-400"
          >
            ← {(course as Course).name}
          </Link>
          <div className="flex items-start gap-3">
            <span className="dc-icon mt-1">
              <QuizIcon />
            </span>
            <h2 className="brand-marquee text-2xl font-bold">
              {(week as Week).label}
            </h2>
          </div>
        </div>
        <Link
          href={`/admin/courses/${courseId}/weeks/${weekId}/print`}
          target="_blank"
          className="link-btn shrink-0 rounded-md border-2 border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500"
        >
          Print Q&amp;A
        </Link>
      </div>
      <TeachingTipsPanel weekId={weekId} />

      <div>
        <h3 className="mb-2 text-lg font-bold" style={{ color: "var(--cyan)" }}>
          Missed questions
        </h3>
        <MissedQuestionsPanel summary={missSummary} />
      </div>

      <QuestionEditorClient
        weekId={weekId}
        initialQuestions={(questions ?? []) as Question[]}
      />
    </div>
  );
}
