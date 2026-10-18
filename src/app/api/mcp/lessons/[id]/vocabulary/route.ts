import { type NextRequest } from "next/server";
import { checkAuth, unauthorized, notFound, badRequest, ok, OPTIONS } from "../../../_auth";
import { pullStore, pushLesson } from "@/feature/lab/lib/sheets";
import { upsertVocab, nowIso, uid } from "@/feature/lab/lib/lesson";
import type { MasteryLevel, VocabItem } from "@/feature/lab/types";

export { OPTIONS };

/** PATCH /api/mcp/lessons/[id]/vocabulary
 *  Strand 2 — upsert vocabulary items for a lesson.
 *  Body: { vocabulary: [{ word, meaning, source_sentence?, explanation?, error_reason?, mastery_level? }] }
 *  Items are matched by word (case-insensitive) or row_id; new items are added.
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
  const incoming = body.vocabulary;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return badRequest("vocabulary must be a non-empty array");
  }

  const ts = nowIso();
  let vocab = [...bundle.vocabulary];

  for (const raw of incoming as Record<string, unknown>[]) {
    const word = String(raw.word ?? "").trim();
    if (!word) continue;

    const item: VocabItem = {
      lesson_id: bundle.input.lesson_id,
      lesson_number: bundle.input.lesson_number,
      lesson_title: bundle.input.lesson_title,
      word,
      meaning: String(raw.meaning ?? ""),
      source_sentence: String(raw.source_sentence ?? ""),
      explanation: String(raw.explanation ?? ""),
      error_reason: String(raw.error_reason ?? ""),
      mastery_level: clampMastery(raw.mastery_level),
      created_at: ts,
      updated_at: ts,
      row_id: String(raw.row_id ?? uid("voc")),
    };

    vocab = upsertVocab(vocab, item);
  }

  await pushLesson({ ...bundle, vocabulary: vocab });
  return ok({ lesson_id: id, vocab_count: vocab.length });
}

/** DELETE /api/mcp/lessons/[id]/vocabulary
 *  Body: { word: string }  OR  { row_id: string }
 *  Removes a single vocabulary item.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkAuth(req)) return unauthorized();
  const { id } = await params;

  const store = await pullStore();
  const bundle = store.lessons.find((l) => l.input.lesson_id === id);
  if (!bundle) return notFound();

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const word = String(body.word ?? "").trim().toLowerCase();
  const rowId = String(body.row_id ?? "").trim();

  if (!word && !rowId) return badRequest("Provide word or row_id to delete");

  const before = bundle.vocabulary.length;
  const vocab = bundle.vocabulary.filter((v) => {
    if (rowId) return v.row_id !== rowId;
    return v.word.toLowerCase() !== word;
  });

  await pushLesson({ ...bundle, vocabulary: vocab });
  return ok({ lesson_id: id, removed: before - vocab.length, vocab_count: vocab.length });
}

function clampMastery(n: unknown): MasteryLevel {
  const v = Number(n);
  if (v === 2 || v === 3 || v === 4) return v;
  return 1;
}
