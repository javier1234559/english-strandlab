import { type NextRequest } from "next/server";
import { checkAuth, unauthorized, notFound, ok, OPTIONS } from "../../_auth";
import { pullStore, pushLesson } from "@/feature/lab/lib/sheets";
import { nowIso } from "@/feature/lab/lib/lesson";
import type { LessonStatus } from "@/feature/lab/types";

export { OPTIONS };

/** GET /api/mcp/lessons/[id]
 *  Returns the full lesson bundle: input + vocabulary + output + fluency
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkAuth(req)) return unauthorized();
  const { id } = await params;

  const store = await pullStore();
  const bundle = store.lessons.find((l) => l.input.lesson_id === id);
  if (!bundle) return notFound();

  return ok({ lesson: bundle });
}

/** PATCH /api/mcp/lessons/[id]
 *  Strand 1 — update lesson metadata / status / notes (content).
 *  Accepted fields: lesson_status, content, lesson_title, cefr_level,
 *                   topic, topic_label, last_reviewed_at, next_review_at
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkAuth(req)) return unauthorized();
  const { id } = await params;

  const store = await pullStore();
  const bundle = store.lessons.find((l) => l.input.lesson_id === id);
  if (!bundle) return notFound();

  const body = (await req.json()) as Record<string, unknown>;

  const ALLOWED: (keyof typeof bundle.input)[] = [
    "lesson_title",
    "content",
    "topic",
    "topic_label",
    "cefr_level",
    "lesson_status",
    "last_reviewed_at",
    "next_review_at",
    "review_count",
  ];

  const patch: Partial<typeof bundle.input> = {};
  for (const key of ALLOWED) {
    if (key in body) (patch as Record<string, unknown>)[key] = body[key];
  }

  // Validate status if provided
  if (patch.lesson_status) {
    const valid: LessonStatus[] = ["not_started", "in_progress", "completed", "due_review"];
    if (!valid.includes(patch.lesson_status)) {
      patch.lesson_status = bundle.input.lesson_status;
    }
  }

  const updated = {
    ...bundle,
    input: { ...bundle.input, ...patch, updated_at: nowIso() },
  };

  await pushLesson(updated);
  return ok({ lesson_id: id, updated: Object.keys(patch) });
}
