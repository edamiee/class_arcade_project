export type QuestionType = "mc" | "tf";

export interface Course {
  id: string;
  name: string;
  created_at: string;
}

export type ExplanationMode = "off" | "immediate" | "end";

export interface Week {
  id: string;
  course_id: string;
  label: string;
  random_order: boolean;
  explanation_mode: ExplanationMode;
  created_at: string;
}

export interface Question {
  id: string;
  week_id: string;
  type: QuestionType;
  prompt: string;
  choices: string[];
  correct_index: number;
  explanation: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  created_at: string;
}

export type SessionMode = "individual" | "team";
export type SessionPacing = "self" | "presenter";

// Fully prepared question as served to a student's /play screen: choices
// already shuffled, correctIndex remapped to match. For presenter-paced
// sessions this exact shape is persisted (sessions.question_order) so
// every student, and the projected /present screen, see the identical
// question AND choice order at the identical moment.
export interface PreparedQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface GameSession {
  id: string;
  course_id: string;
  week_id: string;
  theme: string;
  mode: SessionMode;
  session_code: string;
  is_open: boolean;
  question_count: number | null;
  timer_seconds: number;
  auto_close_at: string | null;
  pacing: SessionPacing;
  question_order: PreparedQuestion[] | null;
  current_question_index: number;
  question_started_at: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  name_key: string;
  created_at: string;
}

export interface AttemptDetail {
  prompt: string;
  chosenText: string;
  correctText: string;
  correct: boolean;
  explanation: string;
}

export interface Attempt {
  id: string;
  student_id: string;
  session_id: string;
  team_id: string | null;
  score: number;
  total: number;
  correct_count: number;
  details: AttemptDetail[];
  played_at: string;
}

export interface AnswerEvent {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  question_id: string;
  prompt: string;
  chosen_text: string;
  correct_text: string;
  correct: boolean;
  team_id: string | null;
  team_name: string | null;
  answered_at: string;
}
