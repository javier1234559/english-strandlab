import { type NextRequest } from "next/server";
import { checkAuth, unauthorized, notFound, ok, OPTIONS } from "../../../_auth";
import { pullStore, pushLesson } from "@/feature/lab/lib/sheets";
import { nowIso } from "@/feature/lab/lib/lesson";
import type { MasteryLevel } from "@/feature/lab/types";

export { OPTIONS };

/** PATCH /api/mcp/lessons/[id]/output
 *  Strand 3 — save writing output for a lesson.
 *  Body: { original_text?, error_summary?, improved_text?, mastery_level? }
 *  - original_text is preserved once set (won't overwrite if already saved).
 *  - error_summary and improved_text are always updatable.
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
  const current = bundle.output!;

  // Preserve original_text once set
  const original_text =
    current.original_text
      ? current.original_text
      : String(body.original_text ?? "");

  const updated = {
    ...bundle,
    output: {
      ...current,
      original_text,
      error_summary:
        "error_summary" in body ? String(body.error_summary ?? "") : current.error_summary,
      improved_text:
        "improved_text" in body ? String(body.improved_text ?? "") : current.improved_text,
      mastery_level:
        "mastery_level" in body ? clampMastery(body.mastery_level) : current.mastery_level,
      updated_at: nowIso(),
    },
  };

  await pushLesson(updated);
  return ok({ lesson_id: id });
}

function clampMastery(n: unknown): MasteryLevel {
  const v = Number(n);
  if (v === 2 || v === 3 || v === 4) return v;
  return 1;
}
