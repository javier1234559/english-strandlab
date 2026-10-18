import { type NextRequest } from "next/server";
import { checkAuth, unauthorized, notFound, ok, OPTIONS } from "../../../_auth";
import { pullStore, pushLesson } from "@/feature/lab/lib/sheets";
import { nowIso } from "@/feature/lab/lib/lesson";

export { OPTIONS };

/** Spaced repetition intervals in days, indexed by review_count (0-based).
 *  0 → complete first time → review in 1 day
 *  1 → reviewed once      → review in 3 days
 *  2 → twice              → 7 days
 *  3 → three times        → 14 days
 *  4 → four times         → 30 days
 *  5+ → five or more      → 60 days
 */
const INTERVALS = [1, 3, 7, 14, 30, 60];

/** POST /api/mcp/lessons/[id]/complete
 *  Marks the lesson completed, increments review_count, and
 *  schedules the next review using spaced repetition intervals.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkAuth(req)) return unauthorized();
  const { id } = await params;

  const store = await pullStore();
  const bundle = store.lessons.find((l) => l.input.lesson_id === id);
  if (!bundle) return notFound();

  const now = new Date();
  const reviewCount = (Number(bundle.input.review_count) || 0) + 1;
  const days = INTERVALS[Math.min(reviewCount - 1, INTERVALS.length - 1)];

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + days);

  const updated = {
    ...bundle,
    input: {
      ...bundle.input,
      lesson_status: "completed" as const,
      last_reviewed_at: nowIso(),
      next_review_at: nextReview.toISOString(),
      review_count: reviewCount,
      updated_at: nowIso(),
    },
  };

  await pushLesson(updated);

  return ok({
    lesson_id: id,
    review_count: reviewCount,
    next_review_at: nextReview.toISOString(),
    days_until_review: days,
  });
}
