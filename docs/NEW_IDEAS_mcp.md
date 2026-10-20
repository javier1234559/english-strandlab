StrandLab — MCP Specification
Tools, inputs/outputs, AI workflow, and UI contract
Purpose: This document defines the MCP tools the StrandLab AI tutor needs, what each tool accepts and returns, and how the AI should use them with the approved minimal UI and Google Sheets schema.
1. Product architecture
- ChatGPT is the tutor: it explains, asks questions, evaluates answers, and guides practice.
- MCP is the data interface: it lets the AI read and write StrandLab records.
- Google Sheets is the source of truth: each entity is stored in its own worksheet.
- StrandLab UI is a journal/viewer: it shows a Home timeline and a unified Detail note, with Open ChatGPT and Sync actions. It is not a separate tutor interface.
The Four Strands guide learning across sessions, but are not mandatory sections for every entry:
1. Meaning-Focused Input
2. Language-Focused Learning
3. Meaning-Focused Output
4. Fluency Development
Important boundary
MCP tools used by ChatGPT do not automatically become callable by the browser UI. The UI's Sync button needs a real configured frontend-accessible backend/API or another supported integration. Never pretend the browser can call MCP directly if it cannot.
2. Google Sheets worksheets
2.1 Input — one row per learning entry
Field	Required	Description
entry_id	Yes	Stable unique ID; never use title as the ID.
created_at	Yes	ISO 8601 creation timestamp.
title	Yes	Short timeline/detail title.
description	Yes	One-sentence timeline preview.
content_mode	Yes	simple or structured.
content_markdown	Yes	For simple: full note body. For structured: original source/general context only; never store the assembled detail view here.
chat_url	No	Real URL to the ChatGPT conversation; never fabricate it.
learning_status	Yes	new, in_progress, paused, or completed. Not a mastery score.
last_review_at	No	Last entry-level review timestamp.
next_review_at	No	Next entry-level review timestamp/date.


Optional later: thumbnail_url, source_type, source_content, updated_at, strands_practiced. Do not make these mandatory until a real need exists.
2.2 Vocabulary — one row per item per entry
Duplicates across entries are intentional. Do not globally deduplicate vocabulary.
Field	Required	Description
vocab_id	Yes	Stable unique ID.
entry_id	Yes	Parent Input entry.
word	Yes	Clean word/expression, e.g. expensive. Do not append (n.) or (adj.) to this field.
type	Yes	Learning-unit category: vocabulary, idiom, quote, sentence, or expression. This is not part of speech.
meaning	Yes	Markdown with meaning, source sentence, examples, collocations, explanations, or notes as useful.
familiarity_level	No	Integer 1–4, or null when not assessed.
error_reason	No	Most recent relevant mistake/confusion; may be cleared when no longer relevant.
last_tested_at	No	Last test/review timestamp.
next_review_at	No	Next review timestamp/date.
updated_at	Yes	Last update timestamp.


2.3 Output — one row per output-practice record
Field	Required	Description
output_id	Yes	Stable unique ID.
entry_id	Yes	Parent Input entry.
content	Yes	Free-form Markdown. May include task, learner answer, feedback, improved version, target vocabulary, and notes.
familiarity_level	No	Integer 1–4, or null when not assessed.
updated_at	Yes	Last update timestamp.


Do not require separate columns for prompt, answer, feedback, corrected answer, or vocabulary used. Keep these in Markdown.
2.4 Fluency — one row per fluency-practice record
Field	Required	Description
fluency_id	Yes	Stable unique ID.
entry_id	Yes	Parent Input entry.
content	Yes	Free-form Markdown for task, transcript, relevant link (including YouTube URL if any), feedback, and notes.
familiarity_level	No	Integer 1–4, or null when not assessed.
updated_at	Yes	Last update timestamp.


Do not require separate task type, duration, transcript, feedback, or video URL columns.
2.5 ReviewLog — append-only review history
Field	Required	Description
review_id	Yes	Stable unique ID.
entry_id	Yes	Entry reviewed.
started_at	Yes	Review start timestamp.
completed_at	No	Completion timestamp.
review_scope	Yes	Short description of what was reviewed.
results_summary	Yes	Concise Markdown summary of answers, errors, progress, and next focus.
review_outcome	Yes	Short outcome/status.
next_review_at	No	Suggested next review date/time.
saved_at	Yes	Timestamp when saved.


Append a new row for every review session. Never overwrite previous review history.
Familiarity levels
Use exactly these values in every relevant worksheet:
Value	Label	Meaning
1	Mới	Newly added; no evidence of familiarity yet.
2	Làm quen	Exposed and beginning to understand.
3	Ghi nhớ	Can recall/use with reasonable independence.
4	Làm chủ	Can use appropriately in new contexts.


Do not increase familiarity merely because a session or entry is completed. An unassessed value is null, not level 1. Do not claim to assess pronunciation, prosody, or speaking speed from text alone.
3. MCP tools to implement
Use these as the recommended public tool names. If an existing MCP server already has equivalent tools, adapt/reuse them rather than creating duplicate endpoints.
Tool 1 — list_entries
Purpose: Find entries for the timeline, find reusable entries, or identify items due for review.

Input
{
  "query": "optional text search",
  "content_mode": "simple",
  "learning_status": "in_progress",
  "due_before": "2026-10-21T00:00:00+07:00",
  "limit": 20,
  "cursor": null
}
All filters are optional. content_mode accepts simple or structured; learning_status accepts new, in_progress, paused, or completed. due_before filters by next_review_at. Support pagination if the data source needs it.

Output
{
  "entries": [
    {
      "entry_id": "entry_...",
      "created_at": "2026-10-20T08:12:00+07:00",
      "title": "A quote about discipline",
      "description": "A quote about habits and consistent action.",
      "content_mode": "structured",
      "learning_status": "in_progress",
      "last_review_at": null,
      "next_review_at": "2026-10-27T08:00:00+07:00",
      "chat_url": null
    }
  ],
  "next_cursor": null
}
Do not include full child Markdown in timeline results. Return enough metadata for the AI to identify entries and the UI to render Home.
Tool 2 — get_entry_detail
Purpose: Retrieve one entry and all related records.

Input
{
  "entry_id": "entry_..."
}
Output
{
  "entry": {
    "entry_id": "entry_...",
    "created_at": "2026-10-20T08:12:00+07:00",
    "title": "A quote about discipline",
    "description": "A quote about habits and consistent action.",
    "content_mode": "structured",
    "content_markdown": "Original quote and context...",
    "chat_url": null,
    "learning_status": "in_progress",
    "last_review_at": null,
    "next_review_at": "2026-10-27T08:00:00+07:00"
  },
  "vocabulary": [],
  "outputs": [],
  "fluency": [],
  "recent_reviews": []
}
Return empty arrays for missing related records. Return a clear not-found error if entry_id does not exist. recent_reviews may be limited to a reasonable number of recent records.
Tool 3 — create_entry
Purpose: Create the parent Input record before adding vocabulary/output/fluency children.

Input
{
  "title": "A quote about discipline",
  "description": "A quote about habits and consistent action.",
  "content_mode": "structured",
  "content_markdown": "Original quote: ...\n\nSource/context: ...",
  "chat_url": null,
  "learning_status": "in_progress",
  "next_review_at": null
}
Required: title, description, content_mode, content_markdown, learning_status. Optional: chat_url, next_review_at. Server generates entry_id and created_at. The AI must pass a real chat_url only when it has one. For structured entries, content_markdown stores source/general context, not a compiled copy of all sections.

Output
{
  "success": true,
  "entry": {
    "entry_id": "entry_generated",
    "created_at": "2026-10-20T08:12:00+07:00",
    "title": "A quote about discipline",
    "description": "A quote about habits and consistent action.",
    "content_mode": "structured",
    "content_markdown": "Original quote: ...\n\nSource/context: ...",
    "chat_url": null,
    "learning_status": "in_progress",
    "last_review_at": null,
    "next_review_at": null
  }
}
The server must generate stable unique IDs and timestamps. Do not create a second entry just because the AI is uncertain; search first when a matching entry may already exist.
Tool 4 — update_entry
Purpose: Update existing entry metadata or its Simple Note body.

Input
{
  "entry_id": "entry_...",
  "title": "Updated title",
  "description": "Updated summary.",
  "content_mode": "simple",
  "content_markdown": "# Notes\nUpdated Markdown...",
  "chat_url": "https://chatgpt.com/...",
  "learning_status": "completed",
  "last_review_at": "2026-10-20T12:00:00+07:00",
  "next_review_at": "2026-10-27T12:00:00+07:00"
}
Only fields supplied should change; omitted fields remain unchanged. Validate enum values. Never overwrite a field with null unless the caller explicitly intends to clear it. The chat_url must be real. Do not set content_markdown to an assembled Structured Learning page.

Output
{
  "success": true,
  "entry": {
    "entry_id": "entry_...",
    "title": "Updated title",
    "content_mode": "simple",
    "learning_status": "completed"
  }
}
Return the updated canonical record, not only a success boolean.
Tool 5 — upsert_vocabulary
Purpose: Add or update a vocabulary item within one specific entry.

Input
{
  "vocab_id": null,
  "entry_id": "entry_...",
  "word": "expensive",
  "type": "vocabulary",
  "meaning": "## Meaning\nĐắt, có giá cao.\n\n## Example\nThis jacket is expensive.",
  "familiarity_level": 1,
  "error_reason": null,
  "last_tested_at": null,
  "next_review_at": null
}
- vocab_id null means create; a known ID means update that record.
- The item is scoped to entry_id.
- Do not deduplicate the word globally or merge records from different entries.
- word must not contain a part-of-speech suffix.
- meaning is Markdown and may include part of speech within the body if useful.
- familiarity_level can be null or an integer 1–4.
- Server generates vocab_id and updated_at for new records/updates as appropriate.
Output
{
  "success": true,
  "action": "created",
  "vocabulary": {
    "vocab_id": "vocab_generated",
    "entry_id": "entry_...",
    "word": "expensive",
    "type": "vocabulary",
    "meaning": "## Meaning\nĐắt, có giá cao.\n\n## Example\nThis jacket is expensive.",
    "familiarity_level": 1,
    "error_reason": null,
    "last_tested_at": null,
    "next_review_at": null,
    "updated_at": "2026-10-20T12:00:00+07:00"
  }
}
action should be created or updated.
Tool 6 — save_output
Purpose: Save a written/output-practice record.

Input
{
  "output_id": null,
  "entry_id": "entry_...",
  "content": "## Task\nWrite about a daily habit.\n\n## My answer\n...\n\n## Feedback\n...\n\n## Improved version\n...",
  "familiarity_level": 2
}
- Null output_id creates a new record; a known ID updates that record.
- content is free-form Markdown.
- Server generates the ID and updated_at.
- Do not force content into fixed subfields.
Output
{
  "success": true,
  "action": "created",
  "output": {
    "output_id": "output_generated",
    "entry_id": "entry_...",
    "content": "## Task\n...",
    "familiarity_level": 2,
    "updated_at": "2026-10-20T12:00:00+07:00"
  }
}
Tool 7 — save_fluency
Purpose: Save a fluency-development practice record.

Input
{
  "fluency_id": null,
  "entry_id": "entry_...",
  "content": "## Practice\nRetell the idea in 60 seconds.\n\n## Notes\nThe main idea was clear; I paused several times.\n\n## Link\nhttps://www.youtube.com/...",
  "familiarity_level": 2
}
- Null fluency_id creates a new record; a known ID updates it.
- content is free-form Markdown and can include a URL if relevant.
- Do not require separate duration, transcript, feedback, or URL fields.
- Server generates the ID and updated_at.
Output
{
  "success": true,
  "action": "created",
  "fluency": {
    "fluency_id": "fluency_generated",
    "entry_id": "entry_...",
    "content": "## Practice\n...",
    "familiarity_level": 2,
    "updated_at": "2026-10-20T12:00:00+07:00"
  }
}
Tool 8 — log_review
Purpose: Append a review session to ReviewLog and update the entry-level review schedule.

Input
{
  "entry_id": "entry_...",
  "started_at": "2026-10-20T11:30:00+07:00",
  "completed_at": "2026-10-20T11:45:00+07:00",
  "review_scope": "Reviewed vocabulary: expensive, overwhelmed; practised using both in sentences.",
  "results_summary": "## Results\n- expensive: recalled correctly.\n- overwhelmed: needed a hint.\n\n## Next focus\nUse overwhelmed in a personal example.",
  "review_outcome": "completed",
  "next_review_at": "2026-10-23T11:45:00+07:00"
}
Server generates review_id and saved_at. This operation should:
1. Append a new ReviewLog row.
2. Update Input.last_review_at and Input.next_review_at.
3. Update relevant Vocabulary rows' last_tested_at, next_review_at, familiarity_level, and error_reason only when the AI provides evidence-based updates through a dedicated update or an explicitly included item-results argument.
To keep the tool simple initially, it is acceptable for log_review to update only the entry-level schedule; vocabulary item updates can be performed with a separate update_vocabulary_review_state tool if the integration needs it.

Output
{
  "success": true,
  "review": {
    "review_id": "review_generated",
    "entry_id": "entry_...",
    "started_at": "2026-10-20T11:30:00+07:00",
    "completed_at": "2026-10-20T11:45:00+07:00",
    "review_scope": "Reviewed vocabulary: expensive, overwhelmed; practised using both in sentences.",
    "results_summary": "## Results\n...",
    "review_outcome": "completed",
    "next_review_at": "2026-10-23T11:45:00+07:00",
    "saved_at": "2026-10-20T11:45:00+07:00"
  },
  "entry_review_state": {
    "last_review_at": "2026-10-20T11:45:00+07:00",
    "next_review_at": "2026-10-23T11:45:00+07:00"
  }
}
Tool 9 — update_vocabulary_review_state (recommended)
Purpose: Update review/mastery metadata for one vocabulary row after the AI tests it.

Input
{
  "vocab_id": "vocab_...",
  "familiarity_level": 3,
  "error_reason": null,
  "last_tested_at": "2026-10-20T11:45:00+07:00",
  "next_review_at": "2026-10-23T11:45:00+07:00"
}
Only update fields supplied. The AI must base the new level on actual evidence. A correct answer does not automatically imply mastery; consider hints, independence, and transfer to a new context.

Output
{
  "success": true,
  "vocabulary": {
    "vocab_id": "vocab_...",
    "familiarity_level": 3,
    "error_reason": null,
    "last_tested_at": "2026-10-20T11:45:00+07:00",
    "next_review_at": "2026-10-23T11:45:00+07:00",
    "updated_at": "2026-10-20T11:45:00+07:00"
  }
}
Tool 10 — get_review_queue (recommended convenience tool)
Purpose: Return items that are due/overdue, plus their context, so the AI can choose a useful review session.

Input
{
  "as_of": "2026-10-20T12:00:00+07:00",
  "limit": 20
}
Output
{
  "as_of": "2026-10-20T12:00:00+07:00",
  "items": [
    {
      "entry_id": "entry_...",
      "title": "A quote about discipline",
      "content_mode": "structured",
      "next_review_at": "2026-10-20T09:00:00+07:00",
      "due_kind": "overdue",
      "vocabulary": [
        {
          "vocab_id": "vocab_...",
          "word": "overwhelmed",
          "meaning": "Feeling unable to cope with everything.",
          "familiarity_level": 2,
          "error_reason": "Confused it with tired."
        }
      ]
    }
  ]
}
The AI can also call list_entries with due_before and then get_entry_detail for each result. Implement this convenience tool only if it simplifies the integration.
4. Which tools are required for MVP?
Minimum useful MCP set
1. list_entries
2. get_entry_detail
3. create_entry
4. update_entry
5. upsert_vocabulary
6. save_output
7. save_fluency
8. log_review
Recommended next:
9. update_vocabulary_review_state
10. get_review_queue

The data adapter should validate all inputs, generate IDs/timestamps, enforce parent entry_id relationships, and return canonical records after writes. Use consistent structured errors for validation failures, missing IDs, and data-source failures.
5. AI workflow: what the AI should do
A. Learner starts learning from any input
Input may be a word, expression, quote, sentence, article, image, or free-form text.
1. Understand the learner's goal and source material.
2. Teach interactively in ChatGPT; do not require a predefined lesson template.
3. Use the Four Strands where useful, but do not force every strand.
4. Before saving, decide whether the content is a standalone/simple note or a structured learning entry.
B. Save a Simple Note
Use this when the learner mainly wants to save a note, quote, source, or explanation without separate structured practice records.
1. Call list_entries if needed to check whether the user is asking to update an existing note.
2. Call create_entry with content_mode: "simple" and the complete Markdown note in content_markdown.
3. Return the created entry_id and a concise summary to the learner.
For Simple Note, content_markdown is the main content shown on Detail.
C. Save a Structured Learning entry
Use this when the session generated separate vocabulary, written output, or fluency practice records.
1. Call create_entry first with content_mode: "structured".
2. Store original source/context and general notes in Input.content_markdown.
3. Call upsert_vocabulary once per vocabulary item, all using the returned entry_id.
4. Call save_output if meaningful output practice exists.
5. Call save_fluency if meaningful fluency practice exists.
6. Do not create empty placeholder records for strands that were not practised.
7. Never write the assembled detail page back to Input.content_markdown.
8. Return a concise saved summary and the entry title/ID.
D. Continue an existing entry
1. Call get_entry_detail.
2. Use the existing entry_id.
3. Update the relevant record by passing its existing child ID to upsert_vocabulary, save_output, or save_fluency.
4. If adding a genuinely new practice record, create a new child row.
5. Do not create a duplicate parent entry unless the learner is starting a genuinely distinct learning entry.
E. Review session
1. Call get_review_queue if implemented; otherwise use list_entries with a due filter.
2. Fetch relevant detail with get_entry_detail.
3. Quiz the learner interactively. Vary retrieval, example creation, paraphrasing, and contextual use.
4. Judge familiarity from the evidence: correctness, hints required, independence, and use in a new context.
5. Update relevant vocabulary state using update_vocabulary_review_state when available.
6. Call log_review to append the session history and update entry-level review dates.
7. Explain what was recalled, what needs work, and what to review next.
F. Update an entry
- Use update_entry for title, description, mode, status, source/general Markdown, or review schedule.
- Do not use update_entry to save compiled Structured Learning content.
- Never fabricate chat_url, IDs, timestamps, or successful write results.
6. UI contract for the new design
Home Timeline
Display:
- Date separators.
- Time.
- Optional thumbnail.
- Title and one-sentence description.
- Subdued metadata for strands/content available.
- Click/tap to open Detail.
Sort newest first. No “New Note” button. Do not add extra navigation tabs for Review, Vocabulary, or Stats in this approved version.
Detail
Header:
- Back action.
- Title and description.
- Timestamp.
- Optional real ChatGPT link.
- Optional next-review date.
- Small metadata chips only when data exists.
Simple Note:
- Render Input.content_markdown as Markdown.
Structured Learning:
- Render Input source/context first.
- Then Vocabulary, Output, and Fluency in that order when records exist.
- Preserve each record's Markdown.
- Show familiarity using: Mới → Làm quen → Ghi nhớ → Làm chủ.
- Do not show empty sections.
Header actions
- Open ChatGPT: open the real chat_url; if missing, hide/disable the action with a clear hint.
- Sync: must call a real configured repository/API. Show loading, success, and error states. Do not claim success in mock mode.
- The browser UI should not directly call private MCP server tools unless the app's architecture explicitly supports that securely.
7. Operational rules and error handling
- Generate IDs and timestamps server-side.
- Use ISO 8601 timestamps with explicit timezone.
- Validate all enum values and parent IDs.
- Never use a title as a primary key.
- Writes should return the canonical saved record.
- Distinguish created from updated.
- Avoid silent partial writes. If saving a structured entry involves several tools and a later call fails, report which records were saved and which failed; do not claim the entire save succeeded.
- Where possible, implement idempotency or allow the AI to pass existing IDs to avoid duplicate child rows on retries.
- Do not globally deduplicate vocabulary.
- Do not automatically mark content as mastered.
- Preserve previous ReviewLog rows.
- Do not fabricate URLs, sources, or data.
- Never expose credentials or private tokens to frontend code.
- Return clear, actionable errors such as VALIDATION_ERROR, NOT_FOUND, CONFLICT, and DATA_SOURCE_ERROR.
8. Implementation order
1. Inspect the existing MCP server and Sheets integration; reuse equivalent tools if they already exist.
2. Verify worksheet names and actual column headers.
3. Implement and test list_entries, get_entry_detail, create_entry, and update_entry.
4. Implement upsert_vocabulary, save_output, and save_fluency.
5. Implement log_review.
6. Add the optional review-state and review-queue tools if needed.
7. Test Simple Note and Structured Learning end-to-end.
8. Connect the UI repository to a secure API/data source for timeline/detail/sync.
9. Test missing rows, invalid IDs, retries, partial failures, and empty chat_url.
9. End-to-end acceptance tests
- [ ] Create a Simple Note and confirm Detail displays only its Markdown body.
- [ ] Create a Structured Learning entry with source text and two vocabulary items.
- [ ] Add Output and Fluency records to the same entry_id.
- [ ] Confirm Detail assembles all available records in the intended order.
- [ ] Confirm the assembled page is not duplicated into Input.content_markdown.
- [ ] Save the same word under two different entries and confirm both rows remain.
- [ ] Update a vocabulary item using its vocab_id without creating a duplicate.
- [ ] Complete a review and confirm ReviewLog appends a new row.
- [ ] Confirm familiarity labels map correctly for values 1–4.
- [ ] Confirm missing chat_url does not produce a fabricated link.
- [ ] Confirm the UI Sync action reports the real backend result, not a mock success.
- [ ] Confirm a partial save failure is reported accurately.