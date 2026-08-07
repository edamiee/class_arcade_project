// Shared question-shuffling logic, used both by /play (server component,
// self-paced sessions shuffle fresh per request) and by presenter-control-
// client.tsx (an admin client component, computes the shared plan once when
// the teacher clicks "Start round"). Deliberately not "server-only" — it
// has to run in both places.
import type { PreparedQuestion, Question, Week } from "@/lib/types";

export function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function shuffleChoices(q: Question): PreparedQuestion {
  const indices = q.choices.map((_, i) => i);
  const shuffled = shuffle(indices);
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    choices: shuffled.map((i) => q.choices[i]),
    correctIndex: shuffled.indexOf(q.correct_index),
    explanation: q.explanation,
  };
}

export function buildQuestionPlan(
  pool: Question[],
  week: Pick<Week, "random_order">,
  questionCount: number | null
): PreparedQuestion[] {
  const orderedPool = week.random_order !== false ? shuffle(pool) : pool;
  const sliced = questionCount ? orderedPool.slice(0, questionCount) : orderedPool;
  return sliced.map(shuffleChoices);
}
