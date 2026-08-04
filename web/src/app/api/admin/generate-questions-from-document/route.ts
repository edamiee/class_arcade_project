import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { callClaude } from "@/lib/anthropic";
import { stripLeadingNumbering } from "@/lib/sanitize-label";
import type { QuestionType } from "@/lib/types";

interface GeneratedQuestion {
  type: QuestionType;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
}

interface GeneratedWeek {
  label: string;
  questions: GeneratedQuestion[];
}

// Takes a long pasted document (syllabus, chapter, lecture notes) and asks
// Claude to both segment it into logical week-sized topics AND generate
// questions for each — one call producing a whole course's worth of
// content, versus the per-week generator which only ever touches one week
// at a time.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json();
  const courseId: string = body.courseId;
  const document: string = (body.document ?? "").trim();
  const targetWeeks: number | null = body.targetWeeks
    ? Math.max(1, Math.min(12, parseInt(body.targetWeeks, 10)))
    : null;
  const questionsPerWeek = Math.max(
    1,
    Math.min(20, parseInt(body.questionsPerWeek, 10) || 5)
  );
  const type: "mc" | "tf" | "mix" = body.type ?? "mix";

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required." }, { status: 400 });
  }
  if (!document) {
    return NextResponse.json(
      { error: "Paste in the document/notes to generate from." },
      { status: 400 }
    );
  }
  if (document.length > 60000) {
    return NextResponse.json(
      { error: "That document is too long — try splitting it up (max ~60,000 characters)." },
      { status: 400 }
    );
  }

  const { data: course } = await admin.supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  const typeInstruction =
    type === "mc"
      ? 'All questions must be type "mc".'
      : type === "tf"
        ? 'All questions must be type "tf".'
        : 'Mix both "mc" and "tf" types.';

  const weeksInstruction = targetWeeks
    ? `Split it into exactly ${targetWeeks} week-sized topics.`
    : "Split it into a natural number of week-sized topics based on the document's own structure (headings, sections, distinct concepts) — use your judgment, but no more than 12.";

  const systemPrompt =
    "You break down classroom material into a week-by-week quiz plan. " +
    "Respond with ONLY a raw JSON object, no markdown code fences, no commentary. " +
    'It must match exactly: {"weeks":[{"label":string,"questions":[{"type":"mc"|"tf","prompt":string,"choices":string[],"correctIndex":number,"explanation":string}]}]}. ' +
    `${weeksInstruction} Each week must have exactly ${questionsPerWeek} questions. ${typeInstruction} ` +
    'For type "mc" provide exactly 4 choices. For type "tf" choices must be exactly ["True","False"]. ' +
    "correctIndex is the 0-based index into choices of the correct answer. " +
    "Each week's label should be a short, descriptive topic title drawn from the document — no numbering or ordinal prefix of any kind (not \"Week 1\", \"Unit 2:\", \"1.\", \"Q3 -\", etc.), just the topic name itself. " +
    'The player only ever sees the plain text in "prompt" and "choices" — there is no image, table, chart, or diagram rendered anywhere else. ' +
    "Every question MUST be fully self-contained in its prompt: never depend on a table, dataset, chart, or diagram the player is supposed to look at. " +
    "If a question needs sample data to make sense, write that data directly into the prompt as plain text.";

  const userPrompt = `Document/notes:\n\n${document}`;

  let text: string;
  try {
    text = await callClaude(systemPrompt, userPrompt, 8000);
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

  let parsed: { weeks?: GeneratedWeek[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Response was not valid JSON." },
      { status: 502 }
    );
  }
  if (!Array.isArray(parsed.weeks) || parsed.weeks.length === 0) {
    return NextResponse.json(
      { error: "No weeks were returned. Try again with a shorter document." },
      { status: 502 }
    );
  }

  const createdWeeks: { id: string; label: string; questionCount: number }[] = [];
  let questionsCreated = 0;

  for (const w of parsed.weeks) {
    if (!w.label || !Array.isArray(w.questions) || w.questions.length === 0) continue;

    const cleanLabel = stripLeadingNumbering(String(w.label)).slice(0, 200);

    const { data: weekRow, error: weekError } = await admin.supabase
      .from("weeks")
      .insert({ course_id: courseId, label: cleanLabel })
      .select()
      .single();
    if (weekError || !weekRow) continue;

    const rows = w.questions
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
        week_id: weekRow.id,
        type: item.type,
        prompt: String(item.prompt),
        choices: item.choices.map(String),
        correct_index: item.correctIndex,
        explanation: item.explanation ? String(item.explanation) : "",
      }));

    if (rows.length === 0) continue;

    const { data: inserted } = await admin.supabase
      .from("questions")
      .insert(rows)
      .select();

    const count = inserted?.length ?? 0;
    questionsCreated += count;
    createdWeeks.push({ id: weekRow.id, label: weekRow.label, questionCount: count });
  }

  if (createdWeeks.length === 0) {
    return NextResponse.json(
      { error: "Nothing usable came back — try again or shorten the document." },
      { status: 502 }
    );
  }

  return NextResponse.json({ weeksCreated: createdWeeks.length, questionsCreated, weeks: createdWeeks });
}
