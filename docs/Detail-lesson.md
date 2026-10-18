# English StrandLab — Minimal Lesson Detail UI Specification

## 1. Product Goal

English StrandLab is a lightweight learning companion embedded in ChatGPT.

Its purpose is not to host the entire learning experience. The learner interacts with ChatGPT to read stories, answer quizzes, learn vocabulary, write, receive corrections, and practice speaking.

The app provides a simple, editable interface for:

- Viewing lesson information.
- Following the four learning strands.
- Managing a timer for each strand.
- Viewing and editing learning data.
- Saving data through MCP to Google Sheets.
- Resuming a lesson using previously saved information.

**Core principle: The app is an editable interface for lesson data, not a second teaching platform.**

Do not embed comprehension quizzes or duplicate the conversational tutoring interface inside the app.

## 2. Overall Page Layout

Use a single-column, full-width layout with a minimal visual style inspired by Airbnb's clean interface design.

Use:
- White and light-gray surfaces.
- Dark typography.
- Rounded cards.
- Subtle borders and shadows.
- Clear spacing and typography.
- Minimal decorative elements.

Do not use story illustrations, photos, avatars, or other decorative imagery.

Do not create a right sidebar. All lesson information and learning sections should appear in one vertical column.

The page should contain:

1. Lesson Information.
2. Meaning-Focused Input.
3. Language-Focused Learning.
4. Meaning-Focused Output.
5. Fluency Development.

Each section should map clearly to the corresponding lesson data in Google Sheets.

## 3. Section 1 — Lesson Information

Display this section at the top of the page, using the full available width.

### Fields

- `lesson_id`
- `lesson_number`
- `lesson_title`
- `topic`
- `level`
- `content`
- `lesson_status`
- `last_reviewed_at`
- `next_review_at`
- `review_count`
- `created_at`
- `updated_at`

### Presentation

Show the lesson title prominently.

Display supporting metadata in a compact row, such as:

- Lesson number.
- CEFR level.
- Topic.
- Estimated duration.
- Current status.
- Next review date, when available.

The original lesson content may be shown in a compact, expandable text area or content field.

Do not show every technical metadata field prominently. Keep secondary information available for editing or inspection where appropriate.

### Actions

- Edit lesson information.
- Save changes.
- Copy the lesson prompt using a button at the top-right.

The prompt button copies a reusable prompt containing the lesson identity, original content, and relevant lesson context so the learner can continue learning in ChatGPT.

Do not claim to automatically control the ChatGPT conversation unless the existing integration explicitly supports that behavior.

## 4. Section 2 — Meaning-Focused Input

### Purpose

Learners understand meaningful English through reading or listening.

Short description:

"Understand the story and its meaning before focusing on individual language items."

### UI

Create one compact card containing:

1. Section title: **Meaning-Focused Input**.
2. A short description of the strand's purpose.
3. A **Copy Prompt** button at the top-right.
4. An editable text area for saved notes or relevant learning information.
5. A timer.
6. Save and Edit actions.

The actual reading passage and comprehension quiz should be handled through ChatGPT.

The app does not need to reproduce the quiz or create another reading interface.

### Data mapping

Use the corresponding Input worksheet record.

- The original story belongs in `content`.
- Notes or additional fields should only be introduced if they are genuinely needed.
- Lesson review scheduling belongs at the lesson level.

Do not add new Google Sheets columns solely for UI convenience without checking the existing schema.

### Interaction

- Copy Prompt: copy the input-stage prompt.
- Edit: enable editing of the relevant saved fields.
- Save: persist changes through MCP.
- Timer: track time spent in this stage.

The timer should support Start, Pause, Reset, and Complete. It should not automatically mark the stage as mastered.

## 5. Section 3 — Language-Focused Learning

### Purpose

Help learners deliberately study useful vocabulary and language patterns from the story.

Short description:

"Identify unfamiliar expressions, understand their meaning in context, and practice recalling them."

### UI

Create a compact vocabulary card containing:

1. Section title: **Language-Focused Learning**.
2. A short description.
3. A **Copy Prompt** button.
4. A vocabulary list with editable items.
5. An **Add Item** action.
6. A timer.
7. Save and Edit actions.

Each vocabulary item should be presented as an editable row or compact card rather than a large decorative component.

### Vocabulary fields

Each item should expose the existing Google Sheets fields:

- `word`
- `meaning`
- `source_sentence`
- `explanation`
- `error_reason`
- `mastery_level`
- `created_at`
- `updated_at`

Show the lesson relationship through `lesson_id`, but do not require users to edit the ID manually.

The four mastery levels are:

1. Familiarization.
2. Recognition.
3. Recall.
4. Mastery.

Provide a simple dropdown or segmented selector for changing mastery levels.

### Vocabulary interactions

- Add a vocabulary item.
- Edit an existing item.
- Save an item or save multiple changes.
- Remove an item only after confirmation.
- Copy the vocabulary-learning prompt.

Each vocabulary item belongs to the current lesson.

Do not create a separate review schedule for each vocabulary item. The review schedule remains at the lesson level.

### Data persistence

Each vocabulary item should map to one row in the Vocabulary worksheet.

Use a stable identifier or another reliable matching strategy so editing an item updates the correct row rather than creating duplicates.

If the existing worksheet has no stable vocabulary identifier, inspect the current implementation before deciding how to match records.

## 6. Section 4 — Meaning-Focused Output

### Purpose

Help learners use English to express their own ideas and improve their writing through feedback and revision.

Short description:

"Write in English, identify important errors, and improve the original response."

### UI

Create one compact card containing:

1. Section title: **Meaning-Focused Output**.
2. A short description.
3. A **Copy Prompt** button.
4. Three editable text areas.
5. A mastery-level selector.
6. A timer.
7. Save and Edit actions.

### Field 1 — Original Writing

Map to:

- `original_text`

This is the learner's initial writing.

Preserve this field during subsequent reviews. Do not overwrite it when the learner improves their work.

### Field 2 — Error Summary

Map to:

- `error_summary`

Store a concise summary of important errors identified by ChatGPT.

The content may be updated after subsequent review sessions.

### Field 3 — Improved Writing

Map to:

- `improved_text`

Store the latest improved version of the learner's writing.

This field may be overwritten during later revisions, while the original writing remains unchanged.

### Mastery

Map to:

- `mastery_level`

Use the same four-level mastery model, interpreted for writing proficiency.

### Interactions

- Edit each text area.
- Copy the output-stage prompt.
- Start, pause, reset, or complete the timer.
- Save the latest changes through MCP.

Keep all three text areas visually distinct and easy to edit.

Do not create a separate history system for every revision in the MVP.

## 7. Section 5 — Fluency Development

### Purpose

Help learners develop greater fluency by repeatedly expressing familiar ideas.

Short description:

"Repeat the same topic with progressively less time, focusing on faster and more natural expression."

### UI

Create one compact card containing:

1. Section title: **Fluency Development**.
2. A short description.
3. A **Copy Prompt** button.
4. Three editable text areas.
5. A mastery-level selector.
6. A timer.
7. Save and Edit actions.

### Field 1 — Four-Minute Round

Map to:

- `speaking_4min`

Store the content or prepared transcript associated with the four-minute round.

### Field 2 — Three-Minute Round

Map to:

- `speaking_3min`

Store the content or prepared transcript associated with the three-minute round.

### Field 3 — Two-Minute Round

Map to:

- `speaking_2min`

Store the content or prepared transcript associated with the two-minute round.

### Mastery

Map to:

- `mastery_level`

Use four levels:

1. Familiarization.
2. Recognition.
3. Recall.
4. Mastery.

The mastery level should reflect the available evidence. Text alone does not prove that the learner spoke fluently or completed the intended duration.

### Interactions

- Edit each round.
- Copy the fluency-stage prompt.
- Start, pause, reset, or complete the timer.
- Save changes through MCP.

The original 4–3–2 technique requires nine minutes of speaking time, excluding preparation. A shorter beginner adaptation may be offered when appropriate.

## 8. Timer Behavior

Every strand has its own timer.

The initial suggested durations can be configured independently, for example:

- Meaning-Focused Input: 4 minutes.
- Language-Focused Learning: 8 minutes.
- Meaning-Focused Output: 8 minutes.
- Fluency Development: 10 minutes.

These values are initial settings, not fixed scientific recommendations.

Each timer supports:

- Start.
- Pause.
- Reset.
- Complete.

When the timer reaches zero, notify the learner and allow them to continue, complete, or move to the next strand.

The timer must never delete text, overwrite saved data, or force the learner to abandon unfinished work.

Do not build complex timer analytics in the initial version.

## 9. Saving and Editing

The UI should make it obvious which information is saved and which information has unsaved changes.

### Save

When the user saves:

1. Validate the relevant fields.
2. Send the update through the existing MCP integration.
3. Update the appropriate Google Sheets record.
4. Show success feedback only after the save succeeds.
5. Update `updated_at` consistently.

### Edit

Fields should be easy to edit without navigating to another page.

Prefer inline editing or simple text areas and selectors.

Avoid a complicated modal workflow unless the existing UI requires it.

### Existing lesson

When opening a previously studied lesson:

- Load the current Google Sheets records.
- Populate all fields with the saved values.
- Preserve the original writing.
- Show the current improved writing and error summary.
- Show the latest vocabulary records.
- Show the saved fluency content.
- Show lesson-level review information.

The page should function as a persistent, editable representation of the lesson's data.

## 10. Google Sheets and MCP

The four worksheets remain the source of truth for the initial implementation:

- Input.
- Vocabulary.
- Output.
- Fluency.

The UI should map directly to their existing columns.

The app must not invent additional storage layers or duplicate data unnecessarily.

### Important rules

- Use `lesson_id` to associate data with the correct lesson.
- Input, Output, and Fluency have one current record per lesson.
- Vocabulary may have multiple rows per lesson.
- Editing an existing record should update the correct row.
- New vocabulary should create a new row.
- Lesson-level review dates belong in Input.
- Vocabulary mastery belongs in Vocabulary.
- Writing mastery belongs in Output.
- Fluency mastery belongs in Fluency.
- Original writing must never be overwritten by the improved version.
- Failed MCP operations must be reported honestly.

### Prompt copying

Each strand has a Copy Prompt action.

The prompt should contain enough context for ChatGPT to perform the intended activity:

- Lesson ID.
- Lesson title and level.
- Relevant source content.
- The strand's purpose.
- The expected interaction.
- The data fields that should be saved after completion.

Do not include irrelevant worksheet data.

Copying a prompt does not itself execute it or save any data.

The learner interacts with ChatGPT, and the appropriate MCP operation saves the resulting data.

## 11. Visual and Interaction Guidelines

The UI should be extremely simple.

Avoid:

- A right sidebar.
- Illustrations or photos.
- Embedded quizzes.
- Duplicate lesson navigation.
- Large analytics panels inside Lesson Detail.
- Decorative charts unrelated to the current task.
- Excessive cards nested inside other cards.
- Complex forms or modals.
- Features that duplicate ChatGPT's teaching responsibilities.

Prefer:

- One full-width lesson information section.
- Four vertically stacked strand sections.
- Clear section titles and concise descriptions.
- One Copy Prompt button per section.
- Editable text areas and vocabulary rows.
- A timer for each section.
- Simple Save and Edit actions.
- A clear saved/unsaved state.

The interface should feel like a clean, human-friendly spreadsheet editor rather than a complicated learning management system.

## 12. Implementation Instructions

Before making changes, inspect the existing codebase, UI library, MCP integration, and Google Sheets schema.

Reuse existing implementations wherever possible.

Do not rebuild the dashboard or roadmap as part of this task unless necessary for integration.

Implement the Lesson Detail page and its interactions first.

Prioritize the following end-to-end flow:

1. Open a lesson.
2. Load the existing lesson data.
3. Edit or review the four strand sections.
4. Copy a strand prompt into ChatGPT.
5. Complete the activity in ChatGPT.
6. Save the resulting data through MCP.
7. Reopen the lesson and verify that the saved values are restored correctly.

The final result should be minimal, editable, and reliable.

**The app's job is to organize and preserve learning data. ChatGPT's job is to teach. MCP connects the two.**