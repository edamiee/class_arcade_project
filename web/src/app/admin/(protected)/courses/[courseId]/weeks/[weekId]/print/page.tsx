import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, Week, Question } from "@/lib/types";
import PrintButton from "./print-button";

// Deliberately NOT the dark arcade theme — this is a worksheet/answer-key
// meant to actually be printed, so it uses plain black-on-white styling
// and a normal system font instead of the pixel font, independent of the
// rest of the app's look.
export default async function PrintWeekPage({
  params,
}: {
  params: Promise<{ courseId: string; weekId: string }>;
}) {
  const { weekId } = await params;
  const supabase = await createClient();

  const { data: week } = await supabase
    .from("weeks")
    .select("*")
    .eq("id", weekId)
    .single();
  if (!week) notFound();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", (week as Week).course_id)
    .single();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("week_id", weekId)
    .order("created_at", { ascending: true });

  const typedQuestions = (questions ?? []) as Question[];

  return (
    <div
      className="min-h-screen bg-white px-8 py-8 text-black"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <a href="../" className="text-sm text-gray-600 underline">
          ← Back
        </a>
        <PrintButton />
      </div>

      <h1 className="text-xl font-bold">
        {(course as Course | null)?.name} — {(week as Week).label}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        {typedQuestions.length} question{typedQuestions.length === 1 ? "" : "s"} ·
        generated {new Date().toLocaleDateString()}
      </p>

      <ol className="list-decimal space-y-6 pl-5">
        {typedQuestions.map((q) => (
          <li key={q.id} className="break-inside-avoid">
            <p className="font-semibold">{q.prompt}</p>
            <ul className="mt-1 space-y-0.5 pl-4">
              {q.choices.map((choice, i) => (
                <li
                  key={i}
                  className={
                    i === q.correct_index
                      ? "font-semibold text-green-700"
                      : "text-gray-700"
                  }
                >
                  {i === q.correct_index ? "✓ " : "— "}
                  {choice}
                </li>
              ))}
            </ul>
            {q.explanation && (
              <p className="mt-1 text-sm italic text-gray-500">
                {q.explanation}
              </p>
            )}
          </li>
        ))}
        {typedQuestions.length === 0 && (
          <p className="text-gray-500">This week has no questions yet.</p>
        )}
      </ol>
    </div>
  );
}
