import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { pullStore, pushLesson } from "@/feature/lab/lib/sheets";
import {
  createBlankLesson,
  nowIso,
  uid,
  upsertVocab,
} from "@/feature/lab/lib/lesson";
import type { LessonStatus, MasteryLevel, VocabItem } from "@/feature/lab/types";

function text(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function err(message: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: message }],
  };
}

function clampMastery(n: unknown): MasteryLevel {
  const v = Number(n);
  if (v === 2 || v === 3 || v === 4) return v;
  return 1;
}

const INTERVALS = [1, 3, 7, 14, 30, 60];

export function registerStrandLabTools(server: McpServer) {
  server.registerTool(
    "get_stats",
    {
      title: "Get learning statistics",
      description:
        "Returns aggregated learning stats: lesson counts by status, vocabulary by mastery level, and how many lessons are due for review. Use this at the start of a session.",
      inputSchema: z.object({}),
    },
    async () => {
      const store = await pullStore();
      const now = new Date().toISOString();
      const allVocab = store.lessons.flatMap((l) => l.vocabulary);
      const vocabByMastery = { 1: 0, 2: 0, 3: 0, 4: 0 };
      for (const v of allVocab) {
        const m = v.mastery_level as 1 | 2 | 3 | 4;
        vocabByMastery[m] += 1;
      }
      const lessonsByStatus = {
        not_started: 0,
        in_progress: 0,
        completed: 0,
        due_review: 0,
      };
      let dueCount = 0;
      for (const l of store.lessons) {
        const s = l.input.lesson_status;
        if (s in lessonsByStatus) {
          lessonsByStatus[s as keyof typeof lessonsByStatus] += 1;
        }
        if (l.input.next_review_at && l.input.next_review_at <= now) dueCount += 1;
      }
      return text({
        total_lessons: store.lessons.length,
        lessons_by_status: lessonsByStatus,
        due_for_review: dueCount,
        total_vocab: allVocab.length,
        vocab_by_mastery: {
          familiarization: vocabByMastery[1],
          recognition: vocabByMastery[2],
          recall: vocabByMastery[3],
          mastery: vocabByMastery[4],
        },
      });
    },
  );

  server.registerTool(
    "list_lessons",
    {
      title: "List roadmap lessons",
      description:
        "List all lessons in the learning roadmap with id, title, CEFR level, topic, status, and review dates. Set due_only=true to only return lessons due for review. Use this to find a lesson_id before calling get_lesson.",
      inputSchema: z.object({
        due_only: z
          .boolean()
          .optional()
          .describe("If true, only return lessons whose next_review_at is past"),
      }),
    },
    async ({ due_only }) => {
      const store = await pullStore();
      const now = new Date().toISOString();
      const lessons = store.lessons
        .filter((l) => {
          if (!due_only) return true;
          return Boolean(l.input.next_review_at && l.input.next_review_at <= now);
        })
        .map((l) => ({
          lesson_id: l.input.lesson_id,
          lesson_number: l.input.lesson_number,
          lesson_title: l.input.lesson_title,
          topic_label: l.input.topic_label,
          cefr_level: l.input.cefr_level,
          lesson_status: l.input.lesson_status,
          last_reviewed_at: l.input.last_reviewed_at,
          next_review_at: l.input.next_review_at,
          review_count: l.input.review_count,
          vocab_count: l.vocabulary.length,
          has_output: Boolean(l.output?.original_text),
          has_fluency: Boolean(l.fluency?.speaking_4min),
        }));
      return text({ count: lessons.length, lessons });
    },
  );

  server.registerTool(
    "get_lesson",
    {
      title: "Get full lesson details",
      description:
        "Return the complete lesson bundle: metadata (input), vocabulary list, writing output, and fluency rounds. Use after list_lessons when you have a lesson_id.",
      inputSchema: z.object({
        lesson_id: z.string().describe("Stable lesson_id from list_lessons"),
      }),
    },
    async ({ lesson_id }) => {
      const store = await pullStore();
      const lesson = store.lessons.find((l) => l.input.lesson_id === lesson_id);
      if (!lesson) return err(`Lesson not found: ${lesson_id}`);
      return text({ lesson });
    },
  );

  server.registerTool(
    "create_lesson",
    {
      title: "Create a new lesson",
      description:
        "Create a new lesson on the roadmap and save it to Google Sheets. Use when the learner pastes a new story or wants a new lesson.",
      inputSchema: z.object({
        lesson_title: z.string().min(1),
        cefr_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
        topic: z.string().optional(),
        topic_label: z.string().optional(),
        content: z.string().optional().describe("Reading passage / story text"),
      }),
    },
    async ({ lesson_title, cefr_level, topic, topic_label, content }) => {
      const store = await pullStore();
      const maxNum = store.lessons.reduce(
        (m, l) => Math.max(m, l.input.lesson_number),
        0,
      );
      const bundle = createBlankLesson({
        title: lesson_title,
        number: maxNum + 1,
        content: content ?? "",
      });
      bundle.input.topic = topic ?? "";
      bundle.input.topic_label = topic_label ?? topic ?? "";
      bundle.input.cefr_level = cefr_level ?? "A1";
      await pushLesson(bundle);
      return text({
        lesson_id: bundle.input.lesson_id,
        lesson_number: bundle.input.lesson_number,
        lesson_title: bundle.input.lesson_title,
        hint: "Remind the user to click Sync in the app to refresh.",
      });
    },
  );

  server.registerTool(
    "update_lesson",
    {
      title: "Update lesson metadata (Strand 1 — Input)",
      description:
        "Update lesson status, story content, title, topic, or review dates. Partial updates supported. Use after reading/comprehension work.",
      inputSchema: z.object({
        lesson_id: z.string(),
        lesson_status: z
          .enum(["not_started", "in_progress", "completed", "due_review"])
          .optional(),
        content: z.string().optional(),
        lesson_title: z.string().optional(),
        cefr_level: z.string().optional(),
        topic: z.string().optional(),
        topic_label: z.string().optional(),
        last_reviewed_at: z.string().optional(),
        next_review_at: z.string().optional(),
      }),
    },
    async (args) => {
      const store = await pullStore();
      const bundle = store.lessons.find((l) => l.input.lesson_id === args.lesson_id);
      if (!bundle) return err(`Lesson not found: ${args.lesson_id}`);

      const patch: Partial<typeof bundle.input> = {};
      const keys = [
        "lesson_status",
        "content",
        "lesson_title",
        "cefr_level",
        "topic",
        "topic_label",
        "last_reviewed_at",
        "next_review_at",
      ] as const;
      for (const key of keys) {
        if (args[key] !== undefined) {
          (patch as Record<string, unknown>)[key] = args[key];
        }
      }
      if (patch.lesson_status) {
        const valid: LessonStatus[] = [
          "not_started",
          "in_progress",
          "completed",
          "due_review",
        ];
        if (!valid.includes(patch.lesson_status)) {
          delete patch.lesson_status;
        }
      }

      const updated = {
        ...bundle,
        input: { ...bundle.input, ...patch, updated_at: nowIso() },
      };
      await pushLesson(updated);
      return text({
        lesson_id: args.lesson_id,
        updated: Object.keys(patch),
        hint: "Remind the user to click Sync in the app to refresh.",
      });
    },
  );

  server.registerTool(
    "upsert_vocabulary",
    {
      title: "Save vocabulary (Strand 2 — Language)",
      description:
        "Upsert vocabulary items for a lesson. Match by word (case-insensitive) or row_id. New items are added; existing items are updated. Use after the learner selects unfamiliar words.",
      inputSchema: z.object({
        lesson_id: z.string(),
        vocabulary: z
          .array(
            z.object({
              word: z.string().min(1),
              meaning: z.string().describe("Vietnamese meaning"),
              source_sentence: z.string().optional(),
              explanation: z.string().optional(),
              error_reason: z.string().optional(),
              mastery_level: z
                .number()
                .int()
                .min(1)
                .max(4)
                .optional()
                .describe("1=Familiarization, 2=Recognition, 3=Recall, 4=Mastery"),
              row_id: z.string().optional(),
            }),
          )
          .min(1),
      }),
    },
    async ({ lesson_id, vocabulary }) => {
      const store = await pullStore();
      const bundle = store.lessons.find((l) => l.input.lesson_id === lesson_id);
      if (!bundle) return err(`Lesson not found: ${lesson_id}`);

      const ts = nowIso();
      let vocab = [...bundle.vocabulary];
      for (const raw of vocabulary) {
        const item: VocabItem = {
          lesson_id: bundle.input.lesson_id,
          lesson_number: bundle.input.lesson_number,
          lesson_title: bundle.input.lesson_title,
          word: raw.word.trim(),
          meaning: raw.meaning ?? "",
          source_sentence: raw.source_sentence ?? "",
          explanation: raw.explanation ?? "",
          error_reason: raw.error_reason ?? "",
          mastery_level: clampMastery(raw.mastery_level),
          created_at: ts,
          updated_at: ts,
          row_id: raw.row_id ?? uid("voc"),
        };
        vocab = upsertVocab(vocab, item);
      }
      await pushLesson({ ...bundle, vocabulary: vocab });
      return text({
        lesson_id,
        vocab_count: vocab.length,
        hint: "Remind the user to click Sync in the app to refresh.",
      });
    },
  );

  server.registerTool(
    "delete_vocabulary",
    {
      title: "Delete a vocabulary item",
      description: "Remove one vocabulary item by word or row_id.",
      inputSchema: z.object({
        lesson_id: z.string(),
        word: z.string().optional(),
        row_id: z.string().optional(),
      }),
    },
    async ({ lesson_id, word, row_id }) => {
      if (!word && !row_id) return err("Provide word or row_id");
      const store = await pullStore();
      const bundle = store.lessons.find((l) => l.input.lesson_id === lesson_id);
      if (!bundle) return err(`Lesson not found: ${lesson_id}`);

      const before = bundle.vocabulary.length;
      const w = (word ?? "").trim().toLowerCase();
      const vocab = bundle.vocabulary.filter((v) => {
        if (row_id) return v.row_id !== row_id;
        return v.word.toLowerCase() !== w;
      });
      await pushLesson({ ...bundle, vocabulary: vocab });
      return text({
        lesson_id,
        removed: before - vocab.length,
        vocab_count: vocab.length,
      });
    },
  );

  server.registerTool(
    "save_output",
    {
      title: "Save writing output (Strand 3 — Output)",
      description:
        "Save writing results. original_text is preserved once set. error_summary and improved_text can be updated on every review.",
      inputSchema: z.object({
        lesson_id: z.string(),
        original_text: z.string().optional(),
        error_summary: z.string().optional(),
        improved_text: z.string().optional(),
        mastery_level: z.number().int().min(1).max(4).optional(),
      }),
    },
    async (args) => {
      const store = await pullStore();
      const bundle = store.lessons.find((l) => l.input.lesson_id === args.lesson_id);
      if (!bundle) return err(`Lesson not found: ${args.lesson_id}`);
      const current = bundle.output!;
      const original_text = current.original_text
        ? current.original_text
        : (args.original_text ?? "");

      await pushLesson({
        ...bundle,
        output: {
          ...current,
          original_text,
          error_summary:
            args.error_summary !== undefined
              ? args.error_summary
              : current.error_summary,
          improved_text:
            args.improved_text !== undefined
              ? args.improved_text
              : current.improved_text,
          mastery_level:
            args.mastery_level !== undefined
              ? clampMastery(args.mastery_level)
              : current.mastery_level,
          updated_at: nowIso(),
        },
      });
      return text({
        lesson_id: args.lesson_id,
        hint: "Remind the user to click Sync in the app to refresh.",
      });
    },
  );

  server.registerTool(
    "save_fluency",
    {
      title: "Save fluency rounds (Strand 4 — Fluency)",
      description:
        "Save 4–3–2 speaking round notes or transcripts for a lesson. Partial updates supported.",
      inputSchema: z.object({
        lesson_id: z.string(),
        speaking_4min: z.string().optional(),
        speaking_3min: z.string().optional(),
        speaking_2min: z.string().optional(),
        mastery_level: z.number().int().min(1).max(4).optional(),
      }),
    },
    async (args) => {
      const store = await pullStore();
      const bundle = store.lessons.find((l) => l.input.lesson_id === args.lesson_id);
      if (!bundle) return err(`Lesson not found: ${args.lesson_id}`);
      const current = bundle.fluency!;

      await pushLesson({
        ...bundle,
        fluency: {
          ...current,
          speaking_4min:
            args.speaking_4min !== undefined
              ? args.speaking_4min
              : current.speaking_4min,
          speaking_3min:
            args.speaking_3min !== undefined
              ? args.speaking_3min
              : current.speaking_3min,
          speaking_2min:
            args.speaking_2min !== undefined
              ? args.speaking_2min
              : current.speaking_2min,
          mastery_level:
            args.mastery_level !== undefined
              ? clampMastery(args.mastery_level)
              : current.mastery_level,
          updated_at: nowIso(),
        },
      });
      return text({
        lesson_id: args.lesson_id,
        hint: "Remind the user to click Sync in the app to refresh.",
      });
    },
  );

  server.registerTool(
    "complete_lesson",
    {
      title: "Mark lesson completed",
      description:
        "Mark a lesson completed, increment review_count, and schedule the next review with spaced repetition (1→3→7→14→30→60 days). Remind the user to Sync the app afterward.",
      inputSchema: z.object({
        lesson_id: z.string(),
      }),
    },
    async ({ lesson_id }) => {
      const store = await pullStore();
      const bundle = store.lessons.find((l) => l.input.lesson_id === lesson_id);
      if (!bundle) return err(`Lesson not found: ${lesson_id}`);

      const reviewCount = (Number(bundle.input.review_count) || 0) + 1;
      const days = INTERVALS[Math.min(reviewCount - 1, INTERVALS.length - 1)];
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + days);

      await pushLesson({
        ...bundle,
        input: {
          ...bundle.input,
          lesson_status: "completed",
          last_reviewed_at: nowIso(),
          next_review_at: nextReview.toISOString(),
          review_count: reviewCount,
          updated_at: nowIso(),
        },
      });

      return text({
        lesson_id,
        review_count: reviewCount,
        next_review_at: nextReview.toISOString(),
        days_until_review: days,
        hint: "Remind the user to click Sync in the app to refresh.",
      });
    },
  );
}
