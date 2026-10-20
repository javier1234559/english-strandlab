StrandLab — Implementation Strategy & Coding Brief
Purpose: Give Cursor or Codex one source of truth for implementing the approved StrandLab UI and architecture.

Product principle: ChatGPT is the tutor. StrandLab is a minimal learning journal and review-data viewer. Google Sheets is the source of truth; MCP is the read/write bridge. Do not turn this into a conventional course platform or build unnecessary features.

1. Product definition
StrandLab helps a learner capture English-learning moments and revisit them later.

The learner can start from almost anything in a ChatGPT conversation: a word, sentence, quote, article, image, or free-form note. ChatGPT teaches interactively and uses the Four Strands as a flexible learning framework:
1. Meaning-Focused Input — understand the source and its meaning.
2. Language-Focused Learning — notice and practise useful language.
3. Meaning-Focused Output — write or express a personal understanding.
4. Fluency Development — practise expressing ideas more smoothly and efficiently.
These strands guide learning over time. They are not mandatory steps or fixed sections for every entry.

When the learner asks to save their work, the AI writes structured data through MCP to Google Sheets. StrandLab displays that data as a simple journal. The user can open the associated ChatGPT conversation to continue learning.
Product boundaries
Build now
- Home timeline of learning entries.
- Detail page for a learning entry.
- Simple Note and Structured Learning display modes.
- Open-chat and Sync actions.
- Loading, empty, error, and sync feedback states.
- A small, maintainable data-access layer that can later connect to the real Sheets/MCP backend.
Do not build now
- A full tutor/chat interface inside StrandLab.
- Manual lesson authoring workflows.
- A complex dashboard, gamification, streaks, or analytics.
- A global vocabulary master or cross-entry deduplication.
- Fixed tabs for the Four Strands.
- A second copy of the assembled Detail content stored in Input.content_markdown.
- Fake backend success or fabricated ChatGPT URLs.
2. Approved UI
2.1 Global shell
- Product name: StrandLab.
- Minimal editorial journal aesthetic: warm off-white background, dark text, muted neutral/olive accents, fine dividers, generous whitespace.
- Use one consistent typography system. Prefer a readable sans-serif for UI and optionally a restrained serif for entry titles.
- Keep navigation minimal. The primary screens are Home and Detail.
- Header: logo/wordmark on the left; two compact circular icon buttons on the right:
  1. Open ChatGPT — opens the selected entry's real chat_url when available.
  2. Sync — refreshes data from the configured data source.
- Do not add a prominent “New Note” button. Entries are created through the AI/MCP workflow.
- Use responsive layout: desktop can use a spacious timeline and a readable detail column; mobile should collapse to one column.
2.2 Home — timeline
Render entries in reverse chronological order using created_at.

Each date group has a centered date label with thin horizontal dividers. Each timeline item can contain:
- Time.
- Optional thumbnail.
- Title.
- Short description.
- Small, subdued strand/type metadata where available.
- A click/tap target that opens Detail.
Keep cards visually light; avoid heavy borders, oversized shadows, and dashboard widgets. Missing thumbnails must not leave broken image boxes. If no thumbnail exists, render a clean text-first entry.

Home states:
- Loading: lightweight skeletons or a simple loading indicator.
- Empty: explain that saved learning entries will appear here after the learner saves a session through ChatGPT.
- Error: show a concise message and a retry action.
- Syncing: disable duplicate sync requests and show visible progress.
- Success: show a small unobtrusive confirmation only after the data source reports success.
2.3 Detail — one continuous note
Detail is a single, scrollable document, not a tabbed workspace.

Header area:
- Back navigation.
- Title.
- Description when available.
- Created/updated time when available.
- Optional link to the source ChatGPT conversation.
- Next-review date when available.
- Small metadata chips for the strands actually practised, when available.
Simple Note mode
When content_mode === "simple":
- Render Input.content_markdown as the main body.
- Support normal Markdown: headings, paragraphs, lists, blockquotes, links, code, and images where supported by the Markdown renderer.
- Do not inject mandatory Vocabulary, Output, or Fluency sections if they do not exist.
Structured Learning mode
When content_mode === "structured":
- Build the displayed document from the Input record and related records linked by entry_id.
- Suggested reading order:
  1. Original input/source and general notes from Input.
  2. Vocabulary records.
  3. Output records.
  4. Fluency records.
- Render a section only when it has content.
- Use the section headings “Vocabulary”, “Output”, and “Fluency” where relevant.
- Keep each child record's Markdown content intact.
- Show each record's familiarity_level using the four approved labels.
- Do not write the assembled Detail view back to Input.content_markdown. The assembled view is derived at render time.
The page should feel like a clean Markdown document. Four Strands are content cues, not mandatory tabs or a rigid template.
2.4 Familiarity display
Use exactly these four levels:
Stored value	UI label	Meaning
1	Mới	Newly added; there is not yet evidence of familiarity.
2	Làm quen	Has been exposed to the item and is beginning to understand it.
3	Ghi nhớ	Can recall or use it with reasonable independence.
4	Làm chủ	Can use it appropriately in new contexts.


- Store numeric values 1–4 in Sheets; map them to labels in the UI.
- Do not automatically mark everything as mastered when an entry is completed.
- AI should update levels based on evidence from answers and practice.
- A missing level means “not assessed”, not “does not know”.
- For Fluency, do not imply that pronunciation, prosody, or speaking speed were objectively assessed unless suitable audio/timing evidence exists.
3. Data model
Google Sheets is the source of truth. Keep a separate worksheet for each entity. Use stable IDs and explicit relationships; never use a title as an identifier.
3.1 Input worksheet
One row per journal entry.
Field	Purpose
entry_id	Stable unique ID; primary key.
created_at	Entry creation timestamp.
title	Short entry title.
description	One-sentence preview for the timeline.
content_mode	simple or structured.
content_markdown	Main Markdown body for Simple Note entries; general notes/source context for structured entries.
chat_url	Real URL to the relevant ChatGPT conversation, supplied or obtained from a reliable integration. May be empty.
learning_status	Suggested values: new, in_progress, paused, completed. This is workflow status, not mastery.
last_review_at	Last entry-level review timestamp.
next_review_at	Next entry-level review date/time.


Optional fields can be added later if a real UI or integration requirement appears, such as thumbnail_url, source_type, source_content, updated_at, or strands_practiced. Do not add fields only for hypothetical future features.
3.2 Vocabulary worksheet
One row per vocabulary item per entry. The same word appearing in multiple entries is intentional. Do not deduplicate across entries.
Field	Purpose
vocab_id	Stable unique ID.
entry_id	Parent entry ID.
word	Clean word or expression, e.g. expensive; do not append a part-of-speech marker to the word.
type	Learning-unit category, e.g. vocabulary, idiom, quote, sentence, expression. This is not grammatical part of speech.
meaning	Markdown containing meaning, source sentence, examples, collocations, or notes as useful.
familiarity_level	Integer 1–4; may be empty when unassessed.
error_reason	Most recent relevant mistake or confusion; may be cleared when no longer relevant.
last_tested_at	Last time this item was tested/reviewed.
next_review_at	Next review date/time for this item.
updated_at	Last update timestamp.


No global vocabulary master in this version.
3.3 Output worksheet
One row per output-practice record.
Field	Purpose
output_id	Stable unique ID.
entry_id	Parent entry ID.
content	Free-form Markdown. It may contain the task, learner's answer, feedback, improved version, vocabulary used, and notes.
familiarity_level	Integer 1–4, or empty if not assessed.
updated_at	Last update timestamp.


Do not split the Markdown into many required columns such as prompt, feedback, improved_text, and vocab_used.
3.4 Fluency worksheet
One row per fluency-practice record.
Field	Purpose
fluency_id	Stable unique ID.
entry_id	Parent entry ID.
content	Free-form Markdown for task, transcript, relevant link (including YouTube URL if any), feedback, and notes.
familiarity_level	Integer 1–4, or empty if not assessed.
updated_at	Last update timestamp.


Do not require separate duration, transcript, feedback, task type, or YouTube URL columns in this version.
3.5 ReviewLog worksheet
Append-only history: one row per review session. Do not overwrite old review history.
Field	Purpose
review_id	Stable unique ID.
entry_id	Entry reviewed.
started_at	Review start timestamp.
completed_at	Completion timestamp, if completed.
review_scope	Short description of what was reviewed.
results_summary	Concise Markdown summary of performance, mistakes, and progress.
review_outcome	Short outcome/status.
next_review_at	Suggested next review date/time.
saved_at	Timestamp when the log was saved.


If an individual vocabulary item is reviewed, review_scope or results_summary should identify it. Add a vocab_id column only if implementation later needs reliable item-level joins.
3.6 Relationship and rendering rules
- Input.entry_id relates to Vocabulary.entry_id, Output.entry_id, and Fluency.entry_id.
- ReviewLog.entry_id relates to the parent Input entry.
- A Simple Note renders Input.content_markdown.
- A Structured Learning entry renders Input context plus related Vocabulary, Output, and Fluency records.
- Do not duplicate child content into the Input worksheet.
- Missing child rows are valid; render only available sections.
- Preserve source Markdown rather than trying to force every note into a rigid schema.
4. Architecture
Use a small, layered architecture:
UI Components
    |
    v
Page / View Model
    |
    v
Repository / Data Service
    |
    +---- Mock repository (local development)
    |
    +---- Real repository (Google Sheets/MCP integration when available)
Rules
1. UI components must not call Google Sheets or MCP directly.
2. Put data fetching, mapping, sorting, and sync logic behind a repository/service interface.
3. Use one canonical frontend model for each entity and map spreadsheet rows into it.
4. Keep the mock repository separate from the real implementation.
5. Clearly label mock data in development. Never silently present fake data as successfully synced real data.
6. If MCP is only available to ChatGPT and not to the browser app, do not pretend the frontend can invoke it. Use an explicitly configured backend/API or keep the Sync action behind an integration interface until one exists.
7. Never expose Google service-account credentials, API secrets, or private tokens in client-side code.
8. Do not invent a chat_url. If absent, disable or hide the Open ChatGPT action and explain why unobtrusively.
Repository contract
Design a minimal interface equivalent to:
type Repository = {
  getEntries(): Promise<InputEntry[]>;
  getEntryDetail(entryId: string): Promise<EntryDetail | null>;
  sync(): Promise<SyncResult>;
};
getEntryDetail() should return the Input record and its related Vocabulary, Output, and Fluency records. Review history can be added to the detail model if the UI needs it.

Use clear TypeScript types and handle errors at the repository boundary. Do not couple the UI to the physical column order of Google Sheets.
Data mapping
- Normalize empty spreadsheet cells to null or empty values consistently.
- Parse timestamps consistently; document the timezone convention. Prefer ISO 8601 timestamps.
- Validate content_mode against simple | structured.
- Validate familiarity_level against 1 | 2 | 3 | 4 | null.
- Sort entries by created_at descending.
- Sort related records deterministically, using updated_at or another documented timestamp.
- Treat missing optional data as normal, not as a fatal error.
5. Suggested frontend structure
Adapt this to the repository's existing framework rather than migrating frameworks without a reason.
src/
  app/
    page.tsx                    # Home timeline
    entries/
      [entryId]/
        page.tsx                # Detail page
  components/
    layout/
      AppHeader.tsx
    timeline/
      TimelineView.tsx
      TimelineDateGroup.tsx
      TimelineEntry.tsx
    detail/
      EntryDetail.tsx
      MarkdownContent.tsx
      VocabularySection.tsx
      ContentRecordSection.tsx
      FamiliarityLabel.tsx
    ui/
      IconButton.tsx
      EmptyState.tsx
      ErrorState.tsx
      LoadingState.tsx
  lib/
    models.ts                    # Canonical TypeScript types
    repository/
      repository.ts              # Interface
      mock-repository.ts         # Development implementation
      real-repository.ts         # Real data adapter when configured
    formatters.ts
    validation.ts
This is a suggested organization, not a mandate. Inspect the existing codebase first and reuse its framework, routing, component library, styling conventions, and existing integrations. Do not create duplicate abstractions if equivalent ones already exist.
6. Interaction details
Home timeline
- Clicking an entry navigates to its Detail route.
- The timeline is read-only in the first version.
- Optional entry menu may be omitted unless it has a real, working action.
- Do not render non-functional kebab menus or decorative buttons.
Open ChatGPT
- Use the selected entry's actual chat_url.
- Open externally in a new tab/window when appropriate.
- If no URL exists, disable the action with a short explanation or omit it.
Sync
- Trigger a real repository refresh.
- Prevent overlapping sync requests.
- Show loading while syncing.
- Report success only after the repository confirms success.
- Preserve the currently displayed data if a refresh fails; show an error and retry option.
- Do not make Sync appear successful when using mock data. Clearly mark mock mode.
Markdown
- Use a maintained Markdown renderer compatible with the current stack.
- Support common Markdown syntax.
- Sanitize or safely handle raw HTML and external links according to the chosen renderer.
- Handle missing or invalid image URLs gracefully.
- Avoid building a custom Markdown editor; the app is primarily a viewer in this version.
Accessibility
- All icon-only buttons need accessible labels/tooltips.
- Use semantic headings and buttons/links.
- Preserve keyboard navigation and visible focus states.
- Ensure muted text still meets reasonable contrast requirements.
- On mobile, make touch targets comfortably tappable.
7. Implementation phases
Phase 0 — Inspect the repository
Before editing:
1. Identify framework, package manager, routing, styling system, and current app structure.
2. Identify existing reusable components and dependencies.
3. Check whether a real Google Sheets/MCP integration already exists.
4. Report the current setup and a short implementation plan.
5. Do not replace the stack or overwrite working code without a clear reason.
Phase 1 — Build the visual shell with typed mock data
- Implement global shell and header.
- Implement Home timeline and date grouping.
- Implement Detail page.
- Implement Simple Note and Structured Learning rendering.
- Add responsive layout and loading/empty/error states.
- Use realistic but clearly marked mock data.
- Ensure the app builds and routes work before integrating a real backend.
Phase 2 — Data model and repository
- Add canonical TypeScript types.
- Implement repository interface.
- Implement mock repository matching the approved worksheet schema.
- Add data validation, sorting, and relationship mapping.
- Add tests for content-mode rendering and related-record assembly.
Phase 3 — Real data integration
Only proceed if the required backend/integration is available and authorized:
- Connect the repository to the configured API/data source.
- Map worksheet rows to canonical models.
- Implement real sync and error handling.
- Keep secrets server-side.
- Verify that the frontend is displaying real data before claiming sync is complete.
If no secure backend or direct integration is available, stop at the repository boundary and document exactly what configuration/backend is still needed. Do not invent an API endpoint.
Phase 4 — Quality pass
- Check desktop and mobile layouts.
- Check empty and missing optional fields.
- Check Markdown rendering and external links.
- Check keyboard accessibility and button labels.
- Run lint, typecheck, tests, and production build using the project's existing scripts.
- Fix regressions before adding polish.
8. Acceptance criteria
The first implementation is ready when:
- [ ] Home shows entries in reverse chronological order.
- [ ] Entries are grouped by date with a restrained timeline layout.
- [ ] Clicking an entry opens its Detail page.
- [ ] Simple Note renders Input.content_markdown.
- [ ] Structured Learning assembles Input + Vocabulary + Output + Fluency using entry_id.
- [ ] The assembled detail is never written back into Input.content_markdown.
- [ ] Missing related records or optional fields do not crash the page.
- [ ] Familiarity levels map correctly: 1 Mới, 2 Làm quen, 3 Ghi nhớ, 4 Làm chủ.
- [ ] Repeated vocabulary across different entries remains separate.
- [ ] Open ChatGPT uses a real chat_url; no URL is fabricated.
- [ ] Sync has visible loading, success, and failure states, and does not fake success.
- [ ] Mock data is clearly separated from real data.
- [ ] No non-functional buttons or decorative controls remain.
- [ ] The app works on desktop and mobile.
- [ ] Lint/typecheck/tests/build pass, or any existing failures are clearly documented.
9. Instructions to Cursor / Codex
Work incrementally. Inspect first, then implement.
1. Read this brief completely.
2. Inspect the existing repository and report its framework, current architecture, and relevant files.
3. Propose a concise plan based on the existing codebase.
4. Implement Phase 1 first unless a working implementation already exists.
5. Keep components small and typed, but avoid unnecessary abstraction.
6. Reuse existing dependencies and conventions. Do not install a new library unless it solves a real requirement.
7. Do not add features outside this brief without asking.
8. Do not silently change the approved data model or UI decisions.
9. After each phase, run the relevant checks and summarize files changed, tests run, results, and remaining blockers.
10. If an integration detail is unknown, create a clear interface and document the missing configuration instead of guessing.
Final design principle: StrandLab should feel like a quiet, personal learning journal—not a course-management dashboard. The UI presents learning; ChatGPT teaches; MCP moves data; Google Sheets stores it.