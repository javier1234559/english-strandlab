/** Mastery 1–4 shared across vocab / writing / fluency */
export type MasteryLevel = 1 | 2 | 3 | 4;

export type LessonStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "due_review";

export type StrandId = "input" | "language" | "output" | "fluency";

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  1: "Familiarization",
  2: "Recognition",
  3: "Recall",
  4: "Mastery",
};

export const STRAND_META: Record<
  StrandId,
  { title: string; short: string; blurb: string }
> = {
  input: {
    title: "Meaning-Focused Input",
    short: "Read & understand",
    blurb:
      "Understand the story and its meaning before focusing on individual language items.",
  },
  language: {
    title: "Language-Focused Learning",
    short: "Vocabulary",
    blurb:
      "Identify unfamiliar expressions, understand their meaning in context, and practice recalling them.",
  },
  output: {
    title: "Meaning-Focused Output",
    short: "Write & improve",
    blurb:
      "Write in English, identify important errors, and improve the original response.",
  },
  fluency: {
    title: "Fluency Development",
    short: "Speak & repeat",
    blurb:
      "Repeat the same topic with progressively less time, focusing on faster and more natural expression.",
  },
};

export interface LessonInput {
  lesson_id: string;
  lesson_number: number;
  lesson_title: string;
  content: string;
  topic: string;
  topic_label: string;
  cefr_level: string;
  created_at: string;
  updated_at: string;
  lesson_status: LessonStatus;
  last_reviewed_at: string;
  next_review_at: string;
  review_count: number;
}

/** Vietnamese labels matching the old quiz stats UI */
export const MASTERY_VI: Record<MasteryLevel, string> = {
  1: "Làm quen",
  2: "Nhận diện",
  3: "Ghi nhớ",
  4: "Làm chủ",
};

export interface VocabItem {
  lesson_id: string;
  lesson_number: number;
  lesson_title: string;
  word: string;
  meaning: string;
  source_sentence: string;
  explanation: string;
  error_reason: string;
  mastery_level: MasteryLevel;
  created_at: string;
  updated_at: string;
  /** Optional local/row id for stable UI keys */
  row_id?: string;
}

export interface LessonOutput {
  lesson_id: string;
  lesson_number: number;
  lesson_title: string;
  original_text: string;
  error_summary: string;
  improved_text: string;
  mastery_level: MasteryLevel;
  created_at: string;
  updated_at: string;
}

export interface LessonFluency {
  lesson_id: string;
  lesson_number: number;
  lesson_title: string;
  speaking_4min: string;
  speaking_3min: string;
  speaking_2min: string;
  mastery_level: MasteryLevel;
  created_at: string;
  updated_at: string;
}

/** Aggregated lesson for the organizer UI */
export interface LessonBundle {
  input: LessonInput;
  vocabulary: VocabItem[];
  output: LessonOutput | null;
  fluency: LessonFluency | null;
}

export interface StrandLabStore {
  version: 1;
  updatedAt: number;
  lessons: LessonBundle[];
}

export interface LabConfig {
  sheetsWebAppUrl: string;
  syncToken: string;
  googleSheetUrl: string;
  storageKey: string;
  sessionModes: { id: string; label: string; minutes: number }[];
}

export interface TimerState {
  strand: StrandId;
  remainingSec: number;
  running: boolean;
  totalSec: number;
}
