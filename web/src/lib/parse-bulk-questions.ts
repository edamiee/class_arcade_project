import type { QuestionType } from "@/lib/types";

// Column layout: type, prompt, correct # (1-based), explanation, then any
// number of trailing choice cells. Choices are trailing/variable-length so
// the fixed columns before them can always be split at a known offset,
// regardless of how many answer choices a row has.
export interface ParsedQuestion {
  type: QuestionType;
  prompt: string;
  choices: string[];
  correct_index: number;
  explanation: string;
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  errors: ParseError[];
}

function splitRow(line: string, delimiter: string): string[] {
  return line
    .split(delimiter)
    .map((cell) => cell.trim().replace(/^"(.*)"$/, "$1").trim());
}

// Accepts tab-separated (the natural format when pasting from a
// spreadsheet — clipboard cells are tab-delimited) or comma-separated
// text. Delimiter is auto-detected from whether the first line has a tab.
export function parseBulkQuestions(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  const questions: ParsedQuestion[] = [];
  const errors: ParseError[] = [];

  if (lines.length === 0) return { questions, errors };

  const delimiter = lines[0].includes("\t") ? "\t" : ",";

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const cells = splitRow(line, delimiter);

    // Skip an optional header row.
    if (lineNum === 1 && cells[0]?.toLowerCase() === "type") return;

    if (cells.length < 4) {
      errors.push({
        line: lineNum,
        message: "Expected at least type, prompt, correct #, explanation.",
      });
      return;
    }

    const [typeRaw, promptRaw, correctRaw, explanationRaw, ...choiceCells] = cells;
    const type = typeRaw.trim().toLowerCase();
    if (type !== "mc" && type !== "tf") {
      errors.push({ line: lineNum, message: `Type must be "mc" or "tf", got "${typeRaw}".` });
      return;
    }

    const prompt = promptRaw.trim();
    if (!prompt) {
      errors.push({ line: lineNum, message: "Prompt is required." });
      return;
    }

    let choices = choiceCells.map((c) => c.trim()).filter(Boolean);
    if (type === "tf" && choices.length === 0) {
      choices = ["True", "False"];
    }
    if (choices.length < 2) {
      errors.push({ line: lineNum, message: "Need at least 2 answer choices." });
      return;
    }

    const correctNum = parseInt(correctRaw.trim(), 10);
    if (!Number.isFinite(correctNum) || correctNum < 1 || correctNum > choices.length) {
      errors.push({
        line: lineNum,
        message: `Correct # must be between 1 and ${choices.length}.`,
      });
      return;
    }

    questions.push({
      type: type as QuestionType,
      prompt,
      choices,
      correct_index: correctNum - 1,
      explanation: explanationRaw.trim(),
    });
  });

  return { questions, errors };
}
