import { type NextRequest } from "next/server";
import { checkAuth, unauthorized, ok, OPTIONS } from "../_auth";
import { pullStore } from "@/feature/lab/lib/sheets";

export { OPTIONS };

/** GET /api/mcp/stats
 *  Returns aggregated learning statistics:
 *  - lesson counts by status
 *  - vocabulary counts by mastery level
 *  - lessons due for review
 */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const store = await pullStore();
  const now = new Date().toISOString();

  const allVocab = store.lessons.flatMap((l) => l.vocabulary);

  const vocabByMastery = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const v of allVocab) {
    const m = v.mastery_level as 1 | 2 | 3 | 4;
    vocabByMastery[m] = (vocabByMastery[m] ?? 0) + 1;
  }

  const lessonsByStatus = { not_started: 0, in_progress: 0, completed: 0, due_review: 0 };
  let dueCount = 0;
  for (const l of store.lessons) {
    const s = l.input.lesson_status;
    if (s in lessonsByStatus) lessonsByStatus[s as keyof typeof lessonsByStatus]++;
    const due = l.input.next_review_at;
    if (due && due <= now) dueCount++;
  }

  return ok({
    stats: {
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
    },
  });
}
