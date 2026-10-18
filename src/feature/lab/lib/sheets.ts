import { labConfig } from "@/feature/lab/lib/config";
import {
  clampMastery,
  emptyFluency,
  emptyOutput,
  emptyStore,
} from "@/feature/lab/lib/lesson";
import type {
  LessonBundle,
  LessonFluency,
  LessonInput,
  LessonOutput,
  LessonStatus,
  StrandLabStore,
  VocabItem,
} from "@/feature/lab/types";

const DEBUG = process.env.NEXT_PUBLIC_APP_ENV !== "production";

function log(...args: unknown[]) {
  if (DEBUG) console.debug("[strandlab/sheets]", ...args);
}

export function configured(): boolean {
  return Boolean(labConfig.sheetsWebAppUrl && labConfig.syncToken);
}

export function getSheetUrl(): string {
  return (labConfig.googleSheetUrl || "").trim();
}

function parseJson(text: string, status: number): Record<string, unknown> {
  const t = text.trim();
  if (!t || t.startsWith("<!DOCTYPE") || t.startsWith("<html")) {
    throw new Error(
      `Sheets API returned HTML (HTTP ${status}). Check Deploy access (Anyone) and new Web App URL.`,
    );
  }
  try {
    return JSON.parse(t) as Record<string, unknown>;
  } catch {
    throw new Error(`Invalid JSON from Sheets (HTTP ${status}): ${t.slice(0, 120)}`);
  }
}

async function request(
  action: string,
  body: Record<string, unknown> = {},
  method: "GET" | "POST" = "POST",
): Promise<Record<string, unknown>> {
  if (!configured()) {
    throw new Error("Chưa cấu hình Sheet — điền .env.local rồi restart pnpm dev.");
  }

  const url = new URL(labConfig.sheetsWebAppUrl);
  url.searchParams.set("token", labConfig.syncToken);
  url.searchParams.set("action", action);

  log(method, action);

  const res =
    method === "GET"
      ? await fetch(url.toString(), { method: "GET", redirect: "follow", cache: "no-store" })
      : await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            token: labConfig.syncToken,
            action,
            ...body,
          }),
          redirect: "follow",
        });

  const text = await res.text();
  log(action, "←", res.status, text.slice(0, 120));
  const data = parseJson(text, res.status);
  if (!data.ok) throw new Error(String(data.error || "Sheets request failed"));
  return data;
}

function asStatus(v: unknown): LessonStatus {
  const s = String(v || "not_started");
  if (
    s === "in_progress" ||
    s === "completed" ||
    s === "due_review" ||
    s === "not_started"
  ) {
    return s;
  }
  return "not_started";
}

function normalizeInput(raw: Record<string, unknown>): LessonInput {
  return {
    lesson_id: String(raw.lesson_id || ""),
    lesson_number: Number(raw.lesson_number) || 0,
    lesson_title: String(raw.lesson_title || ""),
    content: String(raw.content || ""),
    topic: String(raw.topic || ""),
    topic_label: String(raw.topic_label || raw.topic || ""),
    cefr_level: String(raw.cefr_level || ""),
    created_at: String(raw.created_at || ""),
    updated_at: String(raw.updated_at || ""),
    lesson_status: asStatus(raw.lesson_status),
    last_reviewed_at: String(raw.last_reviewed_at || ""),
    next_review_at: String(raw.next_review_at || ""),
    review_count: Number(raw.review_count) || 0,
  };
}

function normalizeVocab(raw: Record<string, unknown>): VocabItem {
  return {
    lesson_id: String(raw.lesson_id || ""),
    lesson_number: Number(raw.lesson_number) || 0,
    lesson_title: String(raw.lesson_title || ""),
    word: String(raw.word || ""),
    meaning: String(raw.meaning || ""),
    source_sentence: String(raw.source_sentence || ""),
    explanation: String(raw.explanation || ""),
    error_reason: String(raw.error_reason || ""),
    mastery_level: clampMastery(raw.mastery_level),
    created_at: String(raw.created_at || ""),
    updated_at: String(raw.updated_at || ""),
    row_id: String(raw.row_id || `${raw.lesson_id}::${raw.word}`),
  };
}

function normalizeOutput(raw: Record<string, unknown>): LessonOutput {
  return {
    lesson_id: String(raw.lesson_id || ""),
    lesson_number: Number(raw.lesson_number) || 0,
    lesson_title: String(raw.lesson_title || ""),
    original_text: String(raw.original_text || ""),
    error_summary: String(raw.error_summary || ""),
    improved_text: String(raw.improved_text || ""),
    mastery_level: clampMastery(raw.mastery_level),
    created_at: String(raw.created_at || ""),
    updated_at: String(raw.updated_at || ""),
  };
}

function normalizeFluency(raw: Record<string, unknown>): LessonFluency {
  return {
    lesson_id: String(raw.lesson_id || ""),
    lesson_number: Number(raw.lesson_number) || 0,
    lesson_title: String(raw.lesson_title || ""),
    speaking_4min: String(raw.speaking_4min || ""),
    speaking_3min: String(raw.speaking_3min || ""),
    speaking_2min: String(raw.speaking_2min || ""),
    mastery_level: clampMastery(raw.mastery_level),
    created_at: String(raw.created_at || ""),
    updated_at: String(raw.updated_at || ""),
  };
}

export function assembleStore(payload: {
  inputs?: Record<string, unknown>[];
  vocabulary?: Record<string, unknown>[];
  outputs?: Record<string, unknown>[];
  fluency?: Record<string, unknown>[];
  updatedAt?: number;
}): StrandLabStore {
  const inputs = (payload.inputs || []).map(normalizeInput).filter((i) => i.lesson_id);
  const vocabAll = (payload.vocabulary || []).map(normalizeVocab);
  const outputs = (payload.outputs || []).map(normalizeOutput);
  const fluency = (payload.fluency || []).map(normalizeFluency);

  const lessons: LessonBundle[] = inputs.map((input) => {
    const vocabulary = vocabAll.filter((v) => v.lesson_id === input.lesson_id);
    const output =
      outputs.find((o) => o.lesson_id === input.lesson_id) || emptyOutput(input);
    const flu =
      fluency.find((f) => f.lesson_id === input.lesson_id) || emptyFluency(input);
    return { input, vocabulary, output, fluency: flu };
  });

  return {
    version: 1,
    updatedAt: Number(payload.updatedAt) || Date.now(),
    lessons,
  };
}

/** Create the four worksheets + headers on the new spreadsheet. */
export async function setupSheets(): Promise<void> {
  await request("setup", {}, "POST");
}

export async function pullStore(): Promise<StrandLabStore> {
  const data = await request("loadAll", {}, "GET");
  return assembleStore({
    inputs: (data.inputs as Record<string, unknown>[]) || [],
    vocabulary: (data.vocabulary as Record<string, unknown>[]) || [],
    outputs: (data.outputs as Record<string, unknown>[]) || [],
    fluency: (data.fluency as Record<string, unknown>[]) || [],
    updatedAt: Number(data.updatedAt) || Date.now(),
  });
}

export async function pushLesson(bundle: LessonBundle): Promise<void> {
  await request(
    "saveLesson",
    {
      input: bundle.input,
      vocabulary: bundle.vocabulary,
      output: bundle.output,
      fluency: bundle.fluency,
    },
    "POST",
  );
}

export async function pushStore(store: StrandLabStore): Promise<void> {
  await request(
    "saveAll",
    {
      inputs: store.lessons.map((l) => l.input),
      vocabulary: store.lessons.flatMap((l) => l.vocabulary),
      outputs: store.lessons.map((l) => l.output).filter(Boolean),
      fluency: store.lessons.map((l) => l.fluency).filter(Boolean),
    },
    "POST",
  );
}

export async function syncStore(local: StrandLabStore): Promise<{
  store: StrandLabStore;
  direction: "pull" | "push" | "noop";
}> {
  if (!configured()) return { store: local, direction: "noop" };

  let remote: StrandLabStore;
  try {
    remote = await pullStore();
  } catch (e) {
    log("pull failed", e);
    throw e;
  }

  const remoteCount = remote.lessons.length;
  const localCount = local.lessons.length;
  const remoteTs = remote.updatedAt || 0;
  const localTs = local.updatedAt || 0;

  log("sync compare", { remoteCount, localCount, remoteTs, localTs });

  if (remoteCount === 0 && localCount === 0) {
    return { store: emptyStore(), direction: "noop" };
  }

  // Prefer remote when it has data and local is empty.
  if (localCount === 0 && remoteCount > 0) {
    return { store: remote, direction: "pull" };
  }

  if (remoteTs > localTs) {
    return { store: remote, direction: "pull" };
  }

  if (localCount > 0 && (localTs >= remoteTs || remoteCount === 0)) {
    await pushStore(local);
    return { store: local, direction: "push" };
  }

  return { store: local, direction: "noop" };
}
