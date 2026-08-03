import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { callClaude } from "@/lib/anthropic";
import type { Attempt, GameSession, Course, Week } from "@/lib/types";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json();
  const attemptId: string = body.attemptId;
  if (!attemptId) {
    return NextResponse.json({ error: "attemptId is required." }, { status: 400 });
  }

  const { data: attempt } = await admin.supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }
  const typedAttempt = attempt as Attempt;

  const { data: session } = await admin.supabase
    .from("sessions")
    .select("*")
    .eq("id", typedAttempt.session_id)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  const typedSession = session as GameSession;

  const [{ data: course }, { data: week }] = await Promise.all([
    admin.supabase
      .from("courses")
      .select("*")
      .eq("id", typedSession.course_id)
      .maybeSingle(),
    admin.supabase
      .from("weeks")
      .select("*")
      .eq("id", typedSession.week_id)
      .maybeSingle(),
  ]);

  const wrongDetails = (typedAttempt.details || []).filter((d) => !d.correct);
  if (wrongDetails.length === 0) {
    return NextResponse.json({ message: "Perfect round — nothing to analyze!" });
  }

  const systemPrompt =
    "You are a teaching assistant analyzing one student quiz session to help them improve. " +
    "You will be given the questions the student got WRONG (their answer, the correct answer, and an explanation where available), plus overall score context. " +
    "Respond with ONLY a well-formatted Markdown document (not JSON, no code fences around the whole thing) containing: " +
    "a short performance summary, a brief per-missed-question explanation of the concept in simple terms, and a short list of general study resource TYPES or topics to review. " +
    'Do not fabricate specific third-party URLs, book titles, or resources you are not certain exist — suggest general topics/strategies instead (e.g. "review your notes on JOIN types", "practice writing WHERE clauses"), never invented links.';

  const userPrompt =
    `Course: ${(course as Course | null)?.name ?? "Unknown"}\n` +
    `Week/topic: ${(week as Week | null)?.label ?? "Unknown"}\n` +
    `Score: ${typedAttempt.score}/${typedAttempt.total} (${typedAttempt.correct_count} correct)\n\n` +
    `Questions missed:\n` +
    wrongDetails
      .map(
        (d, i) =>
          `${i + 1}. ${d.prompt}\n   Student answered: ${d.chosenText}\n   Correct answer: ${d.correctText}` +
          (d.explanation ? `\n   Explanation: ${d.explanation}` : "")
      )
      .join("\n");

  let markdown: string;
  try {
    markdown = await callClaude(systemPrompt, userPrompt, 2000);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed." },
      { status: 502 }
    );
  }

  return NextResponse.json({ markdown: markdown.trim() });
}
