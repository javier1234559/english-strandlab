import { type NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "../_auth";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

const id = (name: string) => ({ type: "string", description: `${name} stable ID` });
const familiarity = { type: ["integer", "null"], enum: [1, 2, 3, 4, null] };

export function GET(req: NextRequest) {
  const base = new URL(req.url).origin;
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "StrandLab Footnote API",
      version: "2.0.0",
      description: "Footnote learning journal data API. The public MCP endpoint is /api/mcp; this document describes the same Google Sheets-backed data contract.",
    },
    servers: [{ url: base }],
    security: [],
    paths: {
      "/api/mcp/entries": {
        get: { operationId: "listEntries", summary: "List Footnote entries", parameters: [
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "content_mode", in: "query", schema: { type: "string", enum: ["simple", "structured"] } },
          { name: "learning_status", in: "query", schema: { type: "string", enum: ["new", "in_progress", "paused", "completed"] } },
          { name: "due_before", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          { name: "cursor", in: "query", schema: { type: ["string", "null"] } },
        ], responses: { "200": { description: "Entry summaries" } } },
        post: { operationId: "createEntry", summary: "Create a Footnote entry", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title", "description", "content_mode", "content_markdown", "learning_status"], properties: { title: { type: "string" }, description: { type: "string" }, content_mode: { type: "string", enum: ["simple", "structured"] }, content_markdown: { type: "string" }, chat_url: { type: ["string", "null"], format: "uri" }, learning_status: { type: "string", enum: ["new", "in_progress", "paused", "completed"] }, next_review_at: { type: ["string", "null"], format: "date-time" } } } } } }, responses: { "200": { description: "Created entry" } } },
      },
      "/api/mcp/entries/{entry_id}": {
        get: { operationId: "getEntryDetail", summary: "Get entry detail and related records", parameters: [{ name: "entry_id", in: "path", required: true, schema: id("entry") }], responses: { "200": { description: "Entry with Vocabulary, Output, Fluency, and recent ReviewLog" }, "404": { description: "Entry not found" } } },
        patch: { operationId: "updateEntry", summary: "Update entry metadata or Simple Note Markdown", parameters: [{ name: "entry_id", in: "path", required: true, schema: id("entry") }], responses: { "200": { description: "Updated entry" } } },
      },
      "/api/mcp/vocabulary": { post: { operationId: "upsertVocabulary", summary: "Create or update vocabulary", responses: { "200": { description: "Saved vocabulary" } } } },
      "/api/mcp/output": { post: { operationId: "saveOutput", summary: "Create or update Output practice", responses: { "200": { description: "Saved output" } } } },
      "/api/mcp/fluency": { post: { operationId: "saveFluency", summary: "Create or update Fluency practice", responses: { "200": { description: "Saved fluency" } } } },
      "/api/mcp/reviews": { post: { operationId: "logReview", summary: "Append a review session", responses: { "200": { description: "Saved ReviewLog row and updated entry schedule" } } } },
      "/api/mcp/vocabulary/{vocab_id}/review-state": { patch: { operationId: "updateVocabularyReviewState", summary: "Update vocabulary familiarity and review state", parameters: [{ name: "vocab_id", in: "path", required: true, schema: id("vocabulary") }], responses: { "200": { description: "Updated vocabulary" } } } },
      "/api/mcp/review-queue": { get: { operationId: "getReviewQueue", summary: "Get entries due for review", responses: { "200": { description: "Due and overdue review items" } } } },
    },
    components: { schemas: { FamiliarityLevel: familiarity } },
  };
  return NextResponse.json(spec, { headers: corsHeaders() });
}
