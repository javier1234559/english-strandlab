import { type NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "../_auth";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export function GET(req: NextRequest) {
  const base = new URL(req.url).origin;

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "English StrandLab API",
      version: "1.0.0",
      description:
        "API for the English StrandLab learning app. Allows ChatGPT to list lessons, retrieve lesson details, save learning progress across the four strands (reading, vocabulary, writing, fluency), and mark lessons complete.",
    },
    servers: [{ url: base }],
    // Auth disabled for testing — open access
    security: [],
    components: {},
    paths: {
      "/api/mcp/stats": {
        get: {
          operationId: "getStats",
          summary: "Get learning statistics",
          description:
            "Returns aggregated stats: total lessons, lessons by status, vocabulary counts by mastery level, and due review count.",
          responses: {
            "200": {
              description: "Statistics object",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      stats: {
                        type: "object",
                        properties: {
                          total_lessons: { type: "integer" },
                          due_for_review: { type: "integer" },
                          total_vocab: { type: "integer" },
                          lessons_by_status: { type: "object" },
                          vocab_by_mastery: { type: "object" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/api/mcp/lessons": {
        get: {
          operationId: "listLessons",
          summary: "List all lessons in the roadmap",
          description:
            "Returns all lessons with their ID, title, CEFR level, topic, status, review dates, and quick progress indicators. Use ?due=true to get only lessons due for review.",
          parameters: [
            {
              name: "due",
              in: "query",
              required: false,
              schema: { type: "boolean" },
              description: "If true, only return lessons whose next_review_at is past",
            },
          ],
          responses: {
            "200": {
              description: "List of lesson summaries",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      count: { type: "integer" },
                      lessons: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          operationId: "createLesson",
          summary: "Create a new lesson",
          description:
            "Creates a new lesson in the roadmap and saves it to Google Sheets. The lesson starts with status not_started.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["lesson_title"],
                  properties: {
                    lesson_title: { type: "string", description: "Title of the lesson" },
                    cefr_level: {
                      type: "string",
                      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
                      default: "A1",
                    },
                    topic: { type: "string", description: "Topic code" },
                    topic_label: { type: "string", description: "Human-readable topic name" },
                    content: {
                      type: "string",
                      description: "The reading passage or lesson text",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Created lesson ID and number",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      lesson_id: { type: "string" },
                      lesson_number: { type: "integer" },
                      lesson_title: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/api/mcp/lessons/{lesson_id}": {
        get: {
          operationId: "getLesson",
          summary: "Get full lesson bundle",
          description:
            "Returns the complete lesson data: lesson metadata, all vocabulary items, writing output, and fluency content.",
          parameters: [
            { name: "lesson_id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Full lesson bundle",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      lesson: {
                        type: "object",
                        properties: {
                          input: { type: "object" },
                          vocabulary: { type: "array", items: { type: "object" } },
                          output: { type: "object" },
                          fluency: { type: "object" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "404": { description: "Lesson not found" },
          },
        },
        patch: {
          operationId: "updateLesson",
          summary: "Update lesson metadata (Strand 1 — Input)",
          description:
            "Update lesson status, content/story text, topic, or review dates. Partial updates are supported — only include the fields you want to change.",
          parameters: [
            { name: "lesson_id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lesson_status: {
                      type: "string",
                      enum: ["not_started", "in_progress", "completed", "due_review"],
                    },
                    content: { type: "string", description: "Lesson reading passage" },
                    lesson_title: { type: "string" },
                    cefr_level: { type: "string" },
                    topic: { type: "string" },
                    topic_label: { type: "string" },
                    last_reviewed_at: { type: "string", format: "date-time" },
                    next_review_at: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Success" },
            "404": { description: "Lesson not found" },
          },
        },
      },

      "/api/mcp/lessons/{lesson_id}/vocabulary": {
        patch: {
          operationId: "upsertVocabulary",
          summary: "Save vocabulary items (Strand 2 — Language)",
          description:
            "Upsert vocabulary items for a lesson. Each item is matched by word (case-insensitive) or row_id. New items are added, existing items are updated. The full updated list is saved to Google Sheets.",
          parameters: [
            { name: "lesson_id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["vocabulary"],
                  properties: {
                    vocabulary: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["word", "meaning"],
                        properties: {
                          word: { type: "string" },
                          meaning: { type: "string", description: "Vietnamese meaning" },
                          source_sentence: { type: "string" },
                          explanation: { type: "string" },
                          error_reason: { type: "string" },
                          mastery_level: {
                            type: "integer",
                            enum: [1, 2, 3, 4],
                            description: "1=Familiarization, 2=Recognition, 3=Recall, 4=Mastery",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Saved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { ok: { type: "boolean" }, vocab_count: { type: "integer" } },
                  },
                },
              },
            },
          },
        },
        delete: {
          operationId: "deleteVocabularyItem",
          summary: "Remove a vocabulary item",
          description: "Delete a single vocabulary item by word or row_id.",
          parameters: [
            { name: "lesson_id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    word: { type: "string" },
                    row_id: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Removed" },
            "400": { description: "word or row_id required" },
          },
        },
      },

      "/api/mcp/lessons/{lesson_id}/output": {
        patch: {
          operationId: "saveOutput",
          summary: "Save writing output (Strand 3 — Output)",
          description:
            "Save the learner's writing results. original_text is preserved once set. error_summary and improved_text can be updated on every review. Partial updates are supported.",
          parameters: [
            { name: "lesson_id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    original_text: { type: "string", description: "Preserved after first save" },
                    error_summary: { type: "string", description: "Key errors from feedback" },
                    improved_text: { type: "string", description: "Latest improved version" },
                    mastery_level: { type: "integer", enum: [1, 2, 3, 4] },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Saved" },
            "404": { description: "Lesson not found" },
          },
        },
      },

      "/api/mcp/lessons/{lesson_id}/fluency": {
        patch: {
          operationId: "saveFluency",
          summary: "Save fluency content (Strand 4 — Fluency)",
          description:
            "Save the learner's 4–3–2 speaking round notes or transcripts. Partial updates are supported.",
          parameters: [
            { name: "lesson_id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    speaking_4min: { type: "string" },
                    speaking_3min: { type: "string" },
                    speaking_2min: { type: "string" },
                    mastery_level: { type: "integer", enum: [1, 2, 3, 4] },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Saved" },
            "404": { description: "Lesson not found" },
          },
        },
      },

      "/api/mcp/lessons/{lesson_id}/complete": {
        post: {
          operationId: "completeLesson",
          summary: "Mark lesson completed with spaced repetition",
          description:
            "Marks the lesson as completed, increments review_count, and calculates the next review date using a spaced repetition schedule (1→3→7→14→30→60 days).",
          parameters: [
            { name: "lesson_id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Lesson completed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      lesson_id: { type: "string" },
                      review_count: { type: "integer" },
                      next_review_at: { type: "string", format: "date-time" },
                      days_until_review: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, { headers: corsHeaders() });
}
