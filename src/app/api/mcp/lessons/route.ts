import { type NextRequest } from "next/server";
import { checkAuth, unauthorized, badRequest, ok, OPTIONS } from "../_auth";
import { pullStore, pushLesson } from "@/feature/lab/lib/sheets";
import { createBlankLesson } from "@/feature/lab/lib/lesson";

export { OPTIONS };

/** GET /api/mcp/lessons
 *  Query: ?due=true  → filter only lessons due for review
 */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const url = new URL(req.url);
  const dueOnly = url.searchParams.get("due") === "true";
  const now = new Date().toISOString();

  const store = await pullStore();

  const lessons = store.lessons
    .filter((l) => {
      if (!dueOnly) return true;
      const due = l.input.next_review_at;
      return due && due <= now;
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

  return ok({ count: lessons.length, lessons });
}

/** POST /api/mcp/lessons
 *  Body: { lesson_title, cefr_level?, topic?, topic_label?, content? }
 *  Creates a new lesson and saves it to Google Sheets.
 */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const body = (await req.json()) as Record<string, unknown>;
  const title = String(body.lesson_title ?? "").trim();
  if (!title) return badRequest("lesson_title is required");

  const store = await pullStore();
  const maxNum = store.lessons.reduce((m, l) => Math.max(m, l.input.lesson_number), 0);

  const bundle = createBlankLesson({ title, number: maxNum + 1, content: String(body.content ?? "") });

  // Merge optional fields
  bundle.input.topic = String(body.topic ?? "");
  bundle.input.topic_label = String(body.topic_label ?? body.topic ?? "");
  bundle.input.cefr_level = String(body.cefr_level ?? "A1");

  await pushLesson(bundle);

  return ok({
    lesson_id: bundle.input.lesson_id,
    lesson_number: bundle.input.lesson_number,
    lesson_title: bundle.input.lesson_title,
  });
}
