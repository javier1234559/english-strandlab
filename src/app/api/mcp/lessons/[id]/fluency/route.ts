import { type NextRequest } from "next/server";
import { checkAuth, unauthorized, notFound, ok, OPTIONS } from "../../../_auth";
import { pullStore, pushLesson } from "@/feature/lab/lib/sheets";
import { nowIso } from "@/feature/lab/lib/lesson";
import type { MasteryLevel } from "@/feature/lab/types";

export { OPTIONS };

/** PATCH /api/mcp/lessons/[id]/fluency
 *  Strand 4 — save fluency content for a lesson.
 *  Body: { speaking_4min?, speaking_3min?, speaking_2min?, mastery_level? }
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
  const current = bundle.fluency!;

  const updated = {
    ...bundle,
    fluency: {
      ...current,
      speaking_4min:
        "speaking_4min" in body ? String(body.speaking_4min ?? "") : current.speaking_4min,
      speaking_3min:
        "speaking_3min" in body ? String(body.speaking_3min ?? "") : current.speaking_3min,
      speaking_2min:
        "speaking_2min" in body ? String(body.speaking_2min ?? "") : current.speaking_2min,
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
