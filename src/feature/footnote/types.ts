export type FootnoteSection = "Input" | "Vocabulary" | "Output" | "Fluency";

export type FamiliarityLevel = 1 | 2 | 3 | 4;
export type ContentMode = "simple" | "structured";
export type LearningStatus = "new" | "in_progress" | "paused" | "completed";

export interface InputEntry {
  entry_id: string;
  created_at: string;
  title: string;
  description: string;
  content_mode: ContentMode;
  content_markdown: string;
  chat_url: string | null;
  thumbnail_url?: string | null;
  strands_practiced?: FootnoteSection[];
  learning_status: LearningStatus;
  last_review_at: string | null;
  next_review_at: string | null;
}

export interface VocabularyRecord {
  vocab_id: string;
  entry_id: string;
  word: string;
  type: string;
  meaning: string;
  familiarity_level: FamiliarityLevel | null;
  error_reason: string | null;
  last_tested_at: string | null;
  next_review_at: string | null;
  updated_at: string;
}

export interface OutputRecord {
  output_id: string;
  entry_id: string;
  content: string;
  familiarity_level: FamiliarityLevel | null;
  updated_at: string;
}

export interface FluencyRecord {
  fluency_id: string;
  entry_id: string;
  content: string;
  familiarity_level: FamiliarityLevel | null;
  updated_at: string;
}

export interface ReviewRecord {
  review_id: string;
  entry_id: string;
  started_at: string;
  completed_at: string | null;
  review_scope: string;
  results_summary: string;
  review_outcome: string;
  next_review_at: string | null;
  saved_at: string;
}

export interface FootnoteStore {
  inputs: InputEntry[];
  vocabulary: VocabularyRecord[];
  outputs: OutputRecord[];
  fluency: FluencyRecord[];
  reviews: ReviewRecord[];
}

export interface FootnoteDetail {
  entry: InputEntry;
  vocabulary: VocabularyRecord[];
  outputs: OutputRecord[];
  fluency: FluencyRecord[];
  reviews: ReviewRecord[];
}

