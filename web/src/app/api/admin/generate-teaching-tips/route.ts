import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { callClaude } from "@/lib/anthropic";
import { getWeekMissSummary } from "@/lib/miss-analysis";

// Aggregate, teacher-facing counterpart to /api/admin/generate-tips (which
// writes a per-student remediation note). This looks at every attempt ever
// recorded against a week's questions and asks: which concepts is the
// class actually struggling with, and how could the teacher reteach them —
// not "what should this one student review."
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json();
  const weekId: string = body.weekId;
  if (!weekId) {
    return NextResponse.json({ error: "weekId is required." }, { status: 400 });
  }

  const { data: week } = await admin.supabase
    .from("weeks")
    .select("label, course_id")
    .eq("id", weekId)
    .maybeSingle();
  if (!week) {
    return NextResponse.json({ error: "Week not found." }, { status: 404 });
  }
  const { data: course } = await admin.supabase
    .from("courses")
    .select("name")
    .eq("id", week.course_id)
    .maybeSingle();

  const summary = await getWeekMissSummary(weekId);
  if (summary.attemptCount === 0) {
    return NextResponse.json({
      message: "No one has played this week's questions yet.",
    });
  }
  if (summary.questions.length === 0) {
    return NextResponse.json({
      message: "Nobody has missed a question on this week yet — nothing to analyze!",
    });
  }

  const systemPrompt =
    "You are an instructional coach helping a teacher improve how they teach a topic, based on aggregate data on which quiz questions their students get wrong most often. " +
    "You are NOT writing feedback to a student — you are advising the TEACHER on their instruction. " +
    "Respond with ONLY a well-formatted Markdown document (no code fences around the whole thing) containing: " +
    "a short summary of the overall pattern, then for each frequently-missed question a brief diagnosis of the likely misconception (informed by the sample wrong answers given) and a concrete suggestion for how to reteach or reframe that concept in class. " +
    "End with a short list of general teaching strategies (e.g. worked examples, common-misconception call-outs, retrieval practice) relevant to the patterns you see. " +
    "Do not fabricate specific third-party URLs, book titles, or resources you are not certain exist.";

  const userPrompt =
    `Course: ${course?.name ?? "Unknown"}\n` +
    `Week/topic: ${week.label}\n` +
    `Total attempts recorded: ${summary.attemptCount}\n\n` +
    `Most-missed questions:\n` +
    summary.questions
      .map(
        (q, i) =>
          `${i + 1}. "${q.prompt}" — missed ${q.missCount} time(s)\n` +
          `   Correct answer: ${q.correctText}\n` +
          (q.explanation ? `   Explanation on file: ${q.explanation}\n` : "") +
          `   Sample wrong answers given: ${q.sampleWrongAnswers.join(", ") || "n/a"}`
      )
      .join("\n");

  let markdown: string;
  try {
    markdown = await callClaude(systemPrompt, userPrompt, 2500);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed." },
      { status: 502 }
    );
  }

  return NextResponse.json({ markdown: markdown.trim() });
}
