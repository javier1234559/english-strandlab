import type {
  LessonBundle,
  LessonFluency,
  LessonInput,
  LessonOutput,
  LessonStatus,
  MasteryLevel,
  StrandLabStore,
  VocabItem,
} from "@/feature/lab/types";

export function nowIso() {
  return new Date().toISOString();
}

export function uid(prefix = "les") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyStore(): StrandLabStore {
  return { version: 1, updatedAt: 0, lessons: [] };
}

export function clampMastery(n: unknown): MasteryLevel {
  const v = Number(n);
  if (v === 2 || v === 3 || v === 4) return v;
  return 1;
}

export function createBlankLesson(opts?: {
  title?: string;
  number?: number;
  content?: string;
}): LessonBundle {
  const lesson_id = uid("les");
  const lesson_number = opts?.number ?? 1;
  const lesson_title = opts?.title?.trim() || `Lesson ${lesson_number}`;
  const ts = nowIso();

  const input: LessonInput = {
    lesson_id,
    lesson_number,
    lesson_title,
    content: opts?.content ?? "",
    topic: "",
    topic_label: "",
    cefr_level: "",
    created_at: ts,
    updated_at: ts,
    lesson_status: "not_started",
    last_reviewed_at: "",
    next_review_at: "",
    review_count: 0,
  };

  return {
    input,
    vocabulary: [],
    output: emptyOutput(input),
    fluency: emptyFluency(input),
  };
}

export function emptyOutput(input: LessonInput): LessonOutput {
  const ts = nowIso();
  return {
    lesson_id: input.lesson_id,
    lesson_number: input.lesson_number,
    lesson_title: input.lesson_title,
    original_text: "",
    error_summary: "",
    improved_text: "",
    mastery_level: 1,
    created_at: ts,
    updated_at: ts,
  };
}

export function emptyFluency(input: LessonInput): LessonFluency {
  const ts = nowIso();
  return {
    lesson_id: input.lesson_id,
    lesson_number: input.lesson_number,
    lesson_title: input.lesson_title,
    speaking_4min: "",
    speaking_3min: "",
    speaking_2min: "",
    mastery_level: 1,
    created_at: ts,
    updated_at: ts,
  };
}

export function effectiveStatus(input: LessonInput): LessonStatus {
  if (input.lesson_status === "due_review") return "due_review";
  if (input.next_review_at) {
    const due = new Date(input.next_review_at).getTime();
    if (Number.isFinite(due) && due <= Date.now()) return "due_review";
  }
  return input.lesson_status;
}

export function sortLessons(lessons: LessonBundle[]): LessonBundle[] {
  return [...lessons].sort((a, b) => {
    const sa = rankStatus(effectiveStatus(a.input));
    const sb = rankStatus(effectiveStatus(b.input));
    if (sa !== sb) return sa - sb;
    return a.input.lesson_number - b.input.lesson_number;
  });
}

function rankStatus(s: LessonStatus) {
  switch (s) {
    case "due_review":
      return 0;
    case "in_progress":
      return 1;
    case "not_started":
      return 2;
    case "completed":
      return 3;
    default:
      return 9;
  }
}

export function upsertVocab(
  list: VocabItem[],
  item: VocabItem,
): VocabItem[] {
  const key = item.row_id || `${item.lesson_id}::${item.word.toLowerCase()}`;
  const next = list.filter(
    (v) => (v.row_id || `${v.lesson_id}::${v.word.toLowerCase()}`) !== key,
  );
  next.push({ ...item, row_id: item.row_id || key, updated_at: nowIso() });
  return next;
}

export function markLessonCompleted(bundle: LessonBundle): LessonBundle {
  const ts = nowIso();
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + 3);
  return {
    ...bundle,
    input: {
      ...bundle.input,
      lesson_status: "completed",
      last_reviewed_at: ts,
      next_review_at: nextReview.toISOString(),
      review_count: (Number(bundle.input.review_count) || 0) + 1,
      updated_at: ts,
    },
  };
}

export function markLessonInProgress(bundle: LessonBundle): LessonBundle {
  if (bundle.input.lesson_status !== "not_started") return bundle;
  return {
    ...bundle,
    input: {
      ...bundle.input,
      lesson_status: "in_progress",
      updated_at: nowIso(),
    },
  };
}
