import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { callClaude } from "@/lib/anthropic";
import type { QuestionType } from "@/lib/types";

interface GeneratedQuestion {
  type: QuestionType;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json();
  const weekId: string = body.weekId;
  const topic: string = (body.topic ?? "").trim();
  const type: "mc" | "tf" | "mix" = body.type ?? "mix";
  const count: number = Math.max(1, Math.min(20, parseInt(body.count, 10) || 5));

  if (!weekId) {
    return NextResponse.json({ error: "weekId is required." }, { status: 400 });
  }
  if (!topic) {
    return NextResponse.json(
      { error: "Describe the topic/material to cover." },
      { status: 400 }
    );
  }

  const { data: week } = await admin.supabase
    .from("weeks")
    .select("id")
    .eq("id", weekId)
    .maybeSingle();
  if (!week) {
    return NextResponse.json({ error: "Week not found." }, { status: 404 });
  }

  const typeInstruction =
    type === "mc"
      ? 'All questions must be type "mc".'
      : type === "tf"
        ? 'All questions must be type "tf".'
        : 'Mix both "mc" and "tf" types.';

  const systemPrompt =
    "You generate quiz questions for a classroom practice game. " +
    "Respond with ONLY a raw JSON array, no markdown code fences, no commentary. " +
    'Each element must match exactly: {"type":"mc"|"tf","prompt":string,"choices":string[],"correctIndex":number,"explanation":string}. ' +
    'For type "mc" provide exactly 4 choices. For type "tf" choices must be exactly ["True","False"]. ' +
    "correctIndex is the 0-based index into choices of the correct answer. " +
    'The player only ever sees the plain text in "prompt" and "choices" — there is no image, table, chart, diagram, or code output rendered anywhere else. ' +
    'Every question MUST be fully self-contained in "prompt" alone: never write a question that depends on a table, sample dataset, chart, or diagram the player is supposed to look at, since none will be shown. ' +
    'If a question needs sample data (e.g. table rows) to make sense, write that data directly into the "prompt" string as plain text so the question is fully answerable on its own.';

  const userPrompt = `Topic/material: ${topic}\nNumber of questions: ${count}\n${typeInstruction}`;

  let text: string;
  try {
    text = await callClaude(systemPrompt, userPrompt, 4000);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed." },
      { status: 502 }
    );
  }

  text = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Response was not valid JSON." },
      { status: 502 }
    );
  }
  if (!Array.isArray(parsed)) {
    return NextResponse.json(
      { error: "Response was not a JSON array." },
      { status: 502 }
    );
  }

  const rows = (parsed as GeneratedQuestion[])
    .filter(
      (item) =>
        item &&
        (item.type === "mc" || item.type === "tf") &&
        item.prompt &&
        Array.isArray(item.choices) &&
        typeof item.correctIndex === "number" &&
        item.correctIndex >= 0 &&
        item.correctIndex < item.choices.length
    )
    .map((item) => ({
      week_id: weekId,
      type: item.type,
      prompt: String(item.prompt),
      choices: item.choices.map(String),
      correct_index: item.correctIndex,
      explanation: item.explanation ? String(item.explanation) : "",
    }));

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid questions were returned. Try again or adjust the topic." },
      { status: 502 }
    );
  }

  const { data: inserted, error } = await admin.supabase
    .from("questions")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ added: inserted.length, questions: inserted });
}
