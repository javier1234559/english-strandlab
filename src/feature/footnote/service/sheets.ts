import type {
  ContentMode,
  FootnoteStore,
  FamiliarityLevel,
  FluencyRecord,
  InputEntry,
  LearningStatus,
  OutputRecord,
  ReviewRecord,
  VocabularyRecord,
} from "@/feature/footnote/types";

const sheetsUrl = process.env.SHEETS_WEB_APP_URL || process.env.NEXT_PUBLIC_SHEETS_WEB_APP_URL || "";
const syncToken = process.env.SYNC_TOKEN || process.env.NEXT_PUBLIC_SYNC_TOKEN || "";

function nowIso() {
  return new Date().toISOString();
}

export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function emptyToNull(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function level(value: unknown): FamiliarityLevel | null {
  const number = Number(value);
  return number >= 1 && number <= 4 && Number.isInteger(number) ? number as FamiliarityLevel : null;
}

function mode(value: unknown): ContentMode {
  return value === "structured" ? "structured" : "simple";
}

function status(value: unknown): LearningStatus {
  return value === "in_progress" || value === "paused" || value === "completed" ? value : "new";
}

function input(row: Record<string, unknown>): InputEntry {
  return {
    entry_id: String(row.entry_id || ""),
    created_at: String(row.created_at || ""),
    title: String(row.title || ""),
    description: String(row.description || ""),
    content_mode: mode(row.content_mode),
    content_markdown: String(row.content_markdown || ""),
    chat_url: emptyToNull(row.chat_url),
    thumbnail_url: emptyToNull(row.thumbnail_url),
    learning_status: status(row.learning_status),
    last_review_at: emptyToNull(row.last_review_at),
    next_review_at: emptyToNull(row.next_review_at),
  };
}

function vocabulary(row: Record<string, unknown>): VocabularyRecord {
  return {
    vocab_id: String(row.vocab_id || ""), entry_id: String(row.entry_id || ""),
    word: String(row.word || ""), type: String(row.type || "vocabulary"),
    meaning: String(row.meaning || ""), familiarity_level: level(row.familiarity_level),
    error_reason: emptyToNull(row.error_reason), last_tested_at: emptyToNull(row.last_tested_at),
    next_review_at: emptyToNull(row.next_review_at), updated_at: String(row.updated_at || ""),
  };
}

function output(row: Record<string, unknown>): OutputRecord {
  return { output_id: String(row.output_id || ""), entry_id: String(row.entry_id || ""), content: String(row.content || ""), familiarity_level: level(row.familiarity_level), updated_at: String(row.updated_at || "") };
}

function fluency(row: Record<string, unknown>): FluencyRecord {
  return { fluency_id: String(row.fluency_id || ""), entry_id: String(row.entry_id || ""), content: String(row.content || ""), familiarity_level: level(row.familiarity_level), updated_at: String(row.updated_at || "") };
}

function review(row: Record<string, unknown>): ReviewRecord {
  return { review_id: String(row.review_id || ""), entry_id: String(row.entry_id || ""), started_at: String(row.started_at || ""), completed_at: emptyToNull(row.completed_at), review_scope: String(row.review_scope || ""), results_summary: String(row.results_summary || ""), review_outcome: String(row.review_outcome || ""), next_review_at: emptyToNull(row.next_review_at), saved_at: String(row.saved_at || "") };
}

function assertConfigured() {
  if (!sheetsUrl || !syncToken) throw new Error("DATA_SOURCE_ERROR: SHEETS_WEB_APP_URL and SYNC_TOKEN are not configured");
}

async function readResponse(response: Response) {
  const data = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || !data?.ok) throw new Error(`DATA_SOURCE_ERROR: ${String(data?.error || `HTTP ${response.status}`)}`);
  return data;
}

async function request(action: string, body: Record<string, unknown> = {}) {
  assertConfigured();
  // Apps Script can be slow to wake from an idle state. Reads use GET so they
  // remain cheap and retryable; writes stay POST because they carry structured
  // JSON payloads and must not be retried blindly.
  if (action === "loadAll") {
    const url = new URL(sheetsUrl);
    url.searchParams.set("token", syncToken);
    url.searchParams.set("action", action);
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(url, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(45_000) });
        return await readResponse(response);
      } catch (error) {
        lastError = error;
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    throw lastError;
  }
  const response = await fetch(sheetsUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token: syncToken, action, ...body }),
    cache: "no-store",
    signal: AbortSignal.timeout(55_000),
    // Google Apps Script acknowledges a POST with a redirect to a
    // googleusercontent URL that does not accept the redirected POST. The
    // original request has already been processed at this point; following it
    // makes fetch report a misleading 404/405 instead.
    redirect: "manual",
  });
  if (response.status >= 300 && response.status < 400) return { ok: true, accepted: true };
  return readResponse(response);
}

export async function loadStore(): Promise<FootnoteStore> {
  const data = await request("loadAll");
  return {
    inputs: ((data.inputs || []) as Record<string, unknown>[]).map(input).filter((row) => row.entry_id),
    vocabulary: ((data.vocabulary || []) as Record<string, unknown>[]).map(vocabulary).filter((row) => row.vocab_id),
    outputs: ((data.outputs || []) as Record<string, unknown>[]).map(output).filter((row) => row.output_id),
    fluency: ((data.fluency || []) as Record<string, unknown>[]).map(fluency).filter((row) => row.fluency_id),
    reviews: ((data.reviews || []) as Record<string, unknown>[]).map(review).filter((row) => row.review_id),
  };
}

export async function resetSheets() { return request("reset"); }
export async function saveInput(entry: InputEntry) { return request("saveInput", { entry }); }
export async function saveVocabulary(record: VocabularyRecord) { return request("saveVocabulary", { vocabulary: record }); }
export async function saveOutput(record: OutputRecord) { return request("saveOutput", { output: record }); }
export async function saveFluency(record: FluencyRecord) { return request("saveFluency", { fluency: record }); }
export async function saveReview(record: ReviewRecord) { return request("appendReview", { review: record }); }

export function timestamp() { return nowIso(); }
