import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { getFootnoteUiMeta, registerFootnoteUi, withFootnoteUi } from "@/feature/footnote/mcp/ui";
import {
  loadStore,
  saveFluency,
  saveInput,
  saveOutput,
  saveReview,
  saveVocabulary,
  timestamp,
  uid,
} from "@/feature/footnote/service/sheets";
import type {
  FamiliarityLevel,
  FluencyRecord,
  InputEntry,
  OutputRecord,
  VocabularyRecord,
} from "@/feature/footnote/types";

const contentMode = z.enum(["simple", "structured"]);
const learningStatus = z.enum(["new", "in_progress", "paused", "completed"]);
const familiarity = z.number().int().min(1).max(4).nullable().optional();
const dateField = z.string().datetime({ offset: true }).nullable().optional();

function result(data: unknown) {
  return withFootnoteUi({
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: typeof data === "object" && data !== null ? data : { data },
  });
}

function failure(code: string, message: string) {
  return withFootnoteUi({
    isError: true as const,
    content: [{ type: "text" as const, text: `${code}: ${message}` }],
    structuredContent: { error: { code, message } },
  });
}

async function safe<T>(work: () => Promise<T>) {
  try { return result(await work()); }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unknown data-source error";
    const separator = message.indexOf(":");
    const code = separator > 0 ? message.slice(0, separator) : "DATA_SOURCE_ERROR";
    return failure(code, separator > 0 ? message.slice(separator + 1).trim() : message);
  }
}

function hasText(value: string, query: string) {
  return value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

function asFamiliarity(value: number | null | undefined): FamiliarityLevel | null {
  return value === null || value === undefined ? null : value as FamiliarityLevel;
}

function entrySummary(entry: InputEntry) {
  return {
    entry_id: entry.entry_id, created_at: entry.created_at, title: entry.title,
    description: entry.description, content_mode: entry.content_mode,
    learning_status: entry.learning_status, last_review_at: entry.last_review_at,
    next_review_at: entry.next_review_at, chat_url: entry.chat_url,
  };
}

function assertChatUrl(url: string | null | undefined) {
  if (url == null || url === "") return;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new Error("not https");
  } catch { throw new Error("VALIDATION_ERROR: chat_url must be a real HTTPS URL"); }
}

function assertEntry(store: Awaited<ReturnType<typeof loadStore>>, entryId: string) {
  const entry = store.inputs.find((item) => item.entry_id === entryId);
  if (!entry) throw new Error(`NOT_FOUND: entry_id ${entryId}`);
  return entry;
}

export function registerFootnoteTools(server: McpServer) {
  // Keep the existing MCP Apps iframe available while the browser repository is separate.
  registerFootnoteUi(server);
  const meta = () => getFootnoteUiMeta();

  server.registerTool("list_entries", {
    title: "List Footnote entries",
    description: "Find learning journal entries by text, mode, status, or review date. Returns timeline metadata only, never full child Markdown.",
    inputSchema: z.object({
      query: z.string().optional(), content_mode: contentMode.optional(), learning_status: learningStatus.optional(),
      due_before: dateField, limit: z.number().int().min(1).max(100).default(20), cursor: z.string().nullable().optional(),
    }), _meta: meta(),
  }, async ({ query, content_mode, learning_status, due_before, limit, cursor }) => safe(async () => {
    const store = await loadStore();
    const offset = cursor ? Math.max(0, Number.parseInt(cursor, 10) || 0) : 0;
    const filtered = store.inputs.filter((entry) => {
      if (query && ![entry.title, entry.description].some((value) => hasText(value, query))) return false;
      if (content_mode && entry.content_mode !== content_mode) return false;
      if (learning_status && entry.learning_status !== learning_status) return false;
      if (due_before && (!entry.next_review_at || entry.next_review_at > due_before)) return false;
      return true;
    }).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const page = filtered.slice(offset, offset + limit);
    return { entries: page.map(entrySummary), next_cursor: offset + limit < filtered.length ? String(offset + limit) : null };
  }));

  server.registerTool("get_entry_detail", {
    title: "Get Footnote entry detail",
    description: "Retrieve one entry and all Vocabulary, Output, Fluency, and recent ReviewLog records linked by entry_id.",
    inputSchema: z.object({ entry_id: z.string().min(1) }), _meta: meta(),
  }, async ({ entry_id }) => safe(async () => {
    const store = await loadStore();
    const entry = assertEntry(store, entry_id);
    return {
      entry, vocabulary: store.vocabulary.filter((item) => item.entry_id === entry_id),
      outputs: store.outputs.filter((item) => item.entry_id === entry_id),
      fluency: store.fluency.filter((item) => item.entry_id === entry_id),
      recent_reviews: store.reviews.filter((item) => item.entry_id === entry_id).sort((a, b) => b.saved_at.localeCompare(a.saved_at)).slice(0, 20),
    };
  }));

  server.registerTool("create_entry", {
    title: "Create Footnote entry",
    description: "Create the parent Input record before saving child Vocabulary, Output, or Fluency records. The server generates entry_id and created_at.",
    inputSchema: z.object({
      title: z.string().trim().min(1), description: z.string().trim().min(1), content_mode: contentMode,
      content_markdown: z.string(), chat_url: z.string().url().nullable().optional(), learning_status: learningStatus,
      next_review_at: dateField,
    }), _meta: meta(),
  }, async (args) => safe(async () => {
    assertChatUrl(args.chat_url);
    const entry: InputEntry = {
      entry_id: uid("entry"), created_at: timestamp(), title: args.title, description: args.description,
      content_mode: args.content_mode, content_markdown: args.content_markdown, chat_url: args.chat_url ?? null,
      learning_status: args.learning_status, last_review_at: null, next_review_at: args.next_review_at ?? null,
    };
    await saveInput(entry);
    return { success: true, entry };
  }));

  server.registerTool("update_entry", {
    title: "Update Footnote entry",
    description: "Partially update entry metadata, Simple Note Markdown, chat URL, status, or review schedule. Never use it for assembled Structured Learning content.",
    inputSchema: z.object({
      entry_id: z.string().min(1), title: z.string().trim().min(1).optional(), description: z.string().trim().min(1).optional(),
      content_mode: contentMode.optional(), content_markdown: z.string().optional(), chat_url: z.string().url().nullable().optional(),
      learning_status: learningStatus.optional(), last_review_at: dateField, next_review_at: dateField,
    }), _meta: meta(),
  }, async ({ entry_id, ...patch }) => safe(async () => {
    const store = await loadStore();
    const current = assertEntry(store, entry_id);
    assertChatUrl(patch.chat_url);
    const entry: InputEntry = {
      ...current,
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.content_mode !== undefined ? { content_mode: patch.content_mode } : {}),
      ...(patch.content_markdown !== undefined ? { content_markdown: patch.content_markdown } : {}),
      ...(patch.chat_url !== undefined ? { chat_url: patch.chat_url } : {}),
      ...(patch.learning_status !== undefined ? { learning_status: patch.learning_status } : {}),
      ...(patch.last_review_at !== undefined ? { last_review_at: patch.last_review_at } : {}),
      ...(patch.next_review_at !== undefined ? { next_review_at: patch.next_review_at } : {}),
    };
    await saveInput(entry);
    return { success: true, entry };
  }));

  server.registerTool("upsert_vocabulary", {
    title: "Save vocabulary",
    description: "Idempotently create or update one vocabulary row scoped to an entry. Pass vocab_id to update an existing row; omit it to create a new row. Do not repeat the same create call after a timeout until get_entry_detail confirms whether it committed.",
    inputSchema: z.object({
      vocab_id: z.string().nullable().optional(), entry_id: z.string().min(1), word: z.string().trim().min(1), type: z.string().trim().min(1), meaning: z.string(),
      familiarity_level: familiarity, error_reason: z.string().nullable().optional(), last_tested_at: dateField, next_review_at: dateField,
    }), _meta: meta(),
  }, async (args) => safe(async () => {
    const store = await loadStore();
    assertEntry(store, args.entry_id);
    if (/\s\((?:n|v|adj|adv|prep)\.?\)$/i.test(args.word)) throw new Error("VALIDATION_ERROR: word must not include a part-of-speech suffix");
    const current = args.vocab_id ? store.vocabulary.find((item) => item.vocab_id === args.vocab_id) : undefined;
    if (args.vocab_id && (!current || current.entry_id !== args.entry_id)) throw new Error(`NOT_FOUND: vocab_id ${args.vocab_id}`);
    const vocabulary: VocabularyRecord = {
      vocab_id: current?.vocab_id ?? uid("vocab"), entry_id: args.entry_id, word: args.word, type: args.type,
      meaning: args.meaning, familiarity_level: args.familiarity_level === undefined ? current?.familiarity_level ?? null : asFamiliarity(args.familiarity_level),
      error_reason: args.error_reason === undefined ? current?.error_reason ?? null : args.error_reason,
      last_tested_at: args.last_tested_at === undefined ? current?.last_tested_at ?? null : args.last_tested_at,
      next_review_at: args.next_review_at === undefined ? current?.next_review_at ?? null : args.next_review_at, updated_at: timestamp(),
    };
    await saveVocabulary(vocabulary);
    return { success: true, action: current ? "updated" : "created", vocabulary };
  }));

  server.registerTool("save_output", {
    title: "Save output practice",
    description: "Idempotently create or update one Markdown Output record. Pass output_id to update an existing row; omit it to create one. Keep Markdown with real newlines, not escaped literal \\n sequences.",
    inputSchema: z.object({ output_id: z.string().nullable().optional(), entry_id: z.string().min(1), content: z.string(), familiarity_level: familiarity }), _meta: meta(),
  }, async (args) => safe(async () => {
    const store = await loadStore(); assertEntry(store, args.entry_id);
    const current = args.output_id ? store.outputs.find((item) => item.output_id === args.output_id) : undefined;
    if (args.output_id && (!current || current.entry_id !== args.entry_id)) throw new Error(`NOT_FOUND: output_id ${args.output_id}`);
    const output: OutputRecord = { output_id: current?.output_id ?? uid("output"), entry_id: args.entry_id, content: args.content, familiarity_level: args.familiarity_level === undefined ? current?.familiarity_level ?? null : asFamiliarity(args.familiarity_level), updated_at: timestamp() };
    await saveOutput(output); return { success: true, action: current ? "updated" : "created", output };
  }));

  server.registerTool("save_fluency", {
    title: "Save fluency practice",
    description: "Idempotently create or update one Markdown Fluency record. Pass fluency_id to update an existing row; omit it to create one. Keep Markdown with real newlines, not escaped literal \\n sequences. Do not claim objective pronunciation or speed assessment from text alone.",
    inputSchema: z.object({ fluency_id: z.string().nullable().optional(), entry_id: z.string().min(1), content: z.string(), familiarity_level: familiarity }), _meta: meta(),
  }, async (args) => safe(async () => {
    const store = await loadStore(); assertEntry(store, args.entry_id);
    const current = args.fluency_id ? store.fluency.find((item) => item.fluency_id === args.fluency_id) : undefined;
    if (args.fluency_id && (!current || current.entry_id !== args.entry_id)) throw new Error(`NOT_FOUND: fluency_id ${args.fluency_id}`);
    const fluency: FluencyRecord = { fluency_id: current?.fluency_id ?? uid("fluency"), entry_id: args.entry_id, content: args.content, familiarity_level: args.familiarity_level === undefined ? current?.familiarity_level ?? null : asFamiliarity(args.familiarity_level), updated_at: timestamp() };
    await saveFluency(fluency); return { success: true, action: current ? "updated" : "created", fluency };
  }));

  server.registerTool("log_review", {
    title: "Log review session",
    description: "Append one ReviewLog row and update the parent entry review schedule. Vocabulary evidence updates use update_vocabulary_review_state.",
    inputSchema: z.object({ entry_id: z.string().min(1), started_at: z.string().datetime({ offset: true }), completed_at: dateField, review_scope: z.string().min(1), results_summary: z.string().min(1), review_outcome: z.string().min(1), next_review_at: dateField }), _meta: meta(),
  }, async (args) => safe(async () => {
    const store = await loadStore(); const entry = assertEntry(store, args.entry_id); const savedAt = timestamp();
    const review = { review_id: uid("review"), entry_id: args.entry_id, started_at: args.started_at, completed_at: args.completed_at ?? null, review_scope: args.review_scope, results_summary: args.results_summary, review_outcome: args.review_outcome, next_review_at: args.next_review_at ?? null, saved_at: savedAt };
    await saveReview(review);
    return { success: true, review, entry_review_state: { last_review_at: review.completed_at ?? savedAt, next_review_at: review.next_review_at ?? entry.next_review_at } };
  }));

  server.registerTool("update_vocabulary_review_state", {
    title: "Update vocabulary review state",
    description: "Update one vocabulary item's familiarity and review metadata only when supported by actual practice evidence.",
    inputSchema: z.object({ vocab_id: z.string().min(1), familiarity_level: familiarity, error_reason: z.string().nullable().optional(), last_tested_at: dateField, next_review_at: dateField }), _meta: meta(),
  }, async ({ vocab_id, ...patch }) => safe(async () => {
    const store = await loadStore(); const current = store.vocabulary.find((item) => item.vocab_id === vocab_id);
    if (!current) throw new Error(`NOT_FOUND: vocab_id ${vocab_id}`);
    const vocabulary: VocabularyRecord = { ...current, ...(patch.familiarity_level !== undefined ? { familiarity_level: asFamiliarity(patch.familiarity_level) } : {}), ...(patch.error_reason !== undefined ? { error_reason: patch.error_reason } : {}), ...(patch.last_tested_at !== undefined ? { last_tested_at: patch.last_tested_at } : {}), ...(patch.next_review_at !== undefined ? { next_review_at: patch.next_review_at } : {}), updated_at: timestamp() };
    await saveVocabulary(vocabulary); return { success: true, vocabulary };
  }));

  server.registerTool("get_review_queue", {
    title: "Get Footnote review queue",
    description: "Return entries due or overdue for review, including vocabulary items due by the requested as_of timestamp.",
    inputSchema: z.object({ as_of: z.string().datetime({ offset: true }).optional(), limit: z.number().int().min(1).max(100).default(20) }), _meta: meta(),
  }, async ({ as_of, limit }) => safe(async () => {
    const store = await loadStore(); const asOf = as_of ?? timestamp();
    const items = store.inputs.filter((entry) => entry.next_review_at && entry.next_review_at <= asOf).sort((a, b) => String(a.next_review_at).localeCompare(String(b.next_review_at))).slice(0, limit).map((entry) => ({
      entry_id: entry.entry_id, title: entry.title, content_mode: entry.content_mode, next_review_at: entry.next_review_at,
      due_kind: entry.next_review_at! < asOf ? "overdue" : "due",
      vocabulary: store.vocabulary.filter((item) => item.entry_id === entry.entry_id && item.next_review_at && item.next_review_at <= asOf).map((item) => ({ vocab_id: item.vocab_id, word: item.word, meaning: item.meaning, familiarity_level: item.familiarity_level, error_reason: item.error_reason })),
    }));
    return { as_of: asOf, items };
  }));
}
