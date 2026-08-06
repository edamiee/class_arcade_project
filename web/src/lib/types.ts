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
