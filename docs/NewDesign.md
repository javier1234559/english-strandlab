# English StrandLab — Product & UI Specification

## 1. Project Overview

**Product:** English StrandLab  
**Purpose:** A personal English-learning system that helps learners turn passive vocabulary into active English through reading, vocabulary learning, writing, speaking, and regular review.

**Core learning framework:** Paul Nation's Four Strands.

**Existing direction:** A lightweight learning app opened directly inside ChatGPT by invoking its connected app/plugin. ChatGPT is the tutor, the app organizes the learning journey, MCP connects the app and tutor to Google Sheets, and Google Sheets stores persistent learning data.

The app should not duplicate the entire ChatGPT conversation interface. Its purpose is to help the learner navigate lessons, manage time, see progress, review previous lessons, and resume learning.

### Product principles

1. Minimal, focused, and easy to understand.
2. Keep the learning roadmap as the primary navigation structure.
3. Separate lesson completion from mastery.
4. Preserve learning progress so users can resume previous lessons.
5. Review knowledge through its original lesson rather than creating disconnected review queues for individual words.
6. Let ChatGPT handle conversational teaching and feedback.
7. Use Google Sheets as the initial persistence layer through MCP.
8. Avoid unnecessary pages, components, data structures, and technical complexity.

---

## 2. User Journey

The main user journey is:

1. Open ChatGPT.
2. Invoke the English StrandLab app/plugin.
3. See the main dashboard.
4. Check learning statistics and activity history.
5. Start reviewing lessons that are due, or select a new lesson from the roadmap.
6. Open the lesson detail page.
7. Continue from previously saved progress or start the lesson for the first time.
8. Complete the four learning strands with ChatGPT.
9. Save the learning results through MCP.
10. Return to the roadmap and continue to the next lesson.

The experience must support both new lessons and previously completed lessons.

A lesson that has been studied before should not be treated as a blank lesson when opened again.

---

# 3. Page Structure

The initial product consists of three primary pages:

1. **Dashboard & Roadmap** — the main landing page.
2. **Review Queue** — a list of lessons due for review.
3. **Lesson Detail** — the main learning and continuation page.

Google Sheets actions should be available from the dashboard. They do not need a separate settings page in the initial version.

Navigation can be implemented using the simplest routing approach supported by the existing project. Do not introduce a new routing system without first inspecting the codebase.

---

# 4. Page 1 — Dashboard & Roadmap

## 4.1 Purpose

The dashboard is the main entry point when the user opens the app in ChatGPT.

It should answer four questions immediately:

- How much have I learned?
- How consistently have I studied?
- What should I review today?
- Which lesson should I learn next?

The page should be minimal and scrollable, with the learning roadmap below the summary sections.

## 4.2 Top action bar

Display four compact actions:

- **Open Sheet:** Open the connected Google Sheet.
- **Sync Sheet:** Synchronize data with Google Sheets.
- **Export:** Export learning data in a supported format.
- **Import:** Import previously exported data or supported lesson data.

### Behavior

**Open Sheet**
- Open the configured spreadsheet using its actual URL.
- Do not invent a spreadsheet URL.

**Sync Sheet**
- Retrieve or synchronize supported data through MCP.
- Show loading, success, or failure feedback.
- Avoid creating duplicate records during synchronization.

**Export**
- Export the available data according to the existing implementation.
- Preserve lesson IDs and relationships between worksheets.

**Import**
- Validate the imported data before changing existing records.
- Avoid silently overwriting existing learning progress.
- Explain validation errors when necessary.

These actions are secondary to learning and should not dominate the page visually.

## 4.3 Learning statistics card

Display a compact statistics section titled **Learning Statistics**.

It contains four metrics representing vocabulary mastery:

- Familiarization
- Recognition
- Recall
- Mastery

The values should be calculated from the actual saved vocabulary records and their current mastery levels.

Suggested definitions:

- Familiarization: `mastery_level = 1`
- Recognition: `mastery_level = 2`
- Recall: `mastery_level = 3`
- Mastery: `mastery_level = 4`

The labels may be displayed in Vietnamese or English according to the existing app language.

Do not hardcode example counts in the real application.

If no vocabulary data exists, display zero values and a helpful empty state.

## 4.4 Learning activity calendar

Below the statistics, display a GitHub-style contribution calendar.

It should show the user's study activity over time, grouped by date.

Each date may represent the amount of recorded learning activity, such as completed lesson activities or review sessions.

Requirements:

- Show the current study streak.
- Show the longest study streak.
- Show the number of active learning days.
- Use intensity levels to represent activity volume.
- Provide a tooltip or accessible date label when a date is selected or hovered.
- Handle dates with no activity.
- Use a consistent timezone when calculating daily activity.

Do not fabricate historical activity. If the available data cannot support a metric, use a sensible empty state rather than inventing values.

The initial implementation can derive activity from available lesson timestamps. A dedicated event-history system is not required.

## 4.5 Review due card

Place a prominent card below the statistics and calendar.

Example:

**REVIEW DUE**

`8 lessons need review`

Primary action: **Review Now**

The count represents lessons whose `next_review_at` is due or overdue, not the number of vocabulary items.

### Behavior

When the user clicks **Review Now**:

1. Retrieve lessons with a due review date.
2. Navigate to the Review Queue page.
3. Display the matching lessons.
4. Allow the user to select one lesson to review.

If no lessons are due, show a positive empty state, such as:

"You're all caught up. Continue with your next lesson."

Do not open a review session if there is no lesson to review.

## 4.6 Learning roadmap

The roadmap appears below the review card and is the primary navigation area.

Organize lessons by CEFR level, such as A1, A2, B1, B2, and so on, according to the available lesson data.

Each level should have a section heading and a clear visual separator.

Within each section, display lessons as a vertical timeline.

Each lesson item includes:

- Lesson number.
- Lesson title.
- Topic or category.
- CEFR level.
- Learning status.

### Visual states

Use a minimal black-and-white visual language.

**Never studied**
- Light or white circular marker.
- Display the lesson number.

**Previously studied**
- Dark circular marker.
- Display a checkmark when the lesson is completed.

**Currently in progress**
- Distinguishable marker or subtle border.
- Show an "In progress" label where appropriate.

**Due for review**
- Preserve the completed lesson's appearance.
- Add a subtle review indicator or label.

The visual state should not imply that a completed lesson is fully mastered. Lesson completion and vocabulary mastery are separate concepts.

### Interaction

When the user clicks a lesson:

- Open its Lesson Detail page.
- If the lesson has saved progress, retrieve that progress and allow the learner to continue.
- If the lesson is new, prepare a new learning session.
- If the lesson is due for review, offer the review flow for that lesson.

The roadmap should not require a separate page for every CEFR level.

### Lesson progression

Do not assume that the next lesson must remain locked until every previous word is mastered.

The learner may continue to new lessons while older lessons remain available for review.

---

# 5. Page 2 — Review Queue

## 5.1 Purpose

The Review Queue is a focused list of lessons that should be revisited.

It is not an independent vocabulary flashcard queue. Review is organized by lesson so that vocabulary, writing, and speaking remain connected to the original learning context.

## 5.2 Header

Display:

- Page title: **Review Due**
- Number of lessons due.
- A short explanation: "Revisit previous lessons to strengthen what you have learned."

Provide a simple way to return to the dashboard.

## 5.3 Lesson list

Each row or card should show:

- Lesson number.
- Lesson title.
- Topic and CEFR level.
- Last reviewed date.
- Next review date.
- Current lesson status.
- A clear action to open the lesson.

Sort lessons by review urgency:

1. Most overdue.
2. Due today.
3. Other due lessons.

The exact sort order may be refined later, but it must be deterministic.

### Data source

Retrieve lesson review information from the lesson-level metadata stored in Google Sheets.

Do not create separate review schedules for individual vocabulary, output, or fluency records.

## 5.4 Review interaction

When the learner selects a lesson:

1. Open Lesson Detail.
2. Load the original lesson and saved learning records.
3. Identify vocabulary and other content that need additional practice.
4. Start a review session rather than resetting the lesson.

The review session should focus on recall and application.

Possible activities:

- Recall vocabulary from context.
- Explain or use selected expressions.
- Correct a previously observed writing error.
- Retell the story or speak about the same topic.

The tutor should prioritize weak areas instead of forcing the learner to repeat every original activity.

## 5.5 Completing a review

After the review:

- Save the updated vocabulary mastery levels.
- Update the current writing and fluency records when applicable.
- Update the lesson's `last_reviewed_at`.
- Calculate a new `next_review_at`.
- Increment `review_count`.
- Return to Lesson Detail or allow the user to return to the dashboard.

A lesson should not be marked as mastered simply because the user opened it or completed a timer.

If the review was only partially completed, preserve the work and use an appropriate continuation state.

---

# 6. Page 3 — Lesson Detail

## 6.1 Purpose

Lesson Detail is the central page of English StrandLab.

It must support three situations:

1. Starting a lesson for the first time.
2. Continuing a lesson that is in progress.
3. Reviewing a previously completed lesson.

The page should help the learner understand where they are in the lesson, what has already been saved, what remains to be done, and how to continue with ChatGPT.

The actual teaching conversation remains in ChatGPT. The app provides structured lesson context, navigation, progress, timers, and persistence.

## 6.2 Page header

Display:

- Lesson number.
- Lesson title.
- Topic or category.
- CEFR level.
- Current lesson status.
- Last studied or last reviewed date when available.

Example:

**Lesson 01 — Coffee with Anna**

People & Family · A1

Status: Completed, In Progress, or Not Started.

For a previously studied lesson, display a compact summary of the saved results.

Possible information:

- Number of saved vocabulary items.
- Whether a writing submission exists.
- Whether speaking practice has been recorded.
- Next review date.

Do not overload the header with every detail.

## 6.3 Lesson overview and progress

Show the four strands as four clearly separated learning stages:

1. Read & Understand
2. Discover & Learn
3. Write & Improve
4. Speak & Repeat

Each stage should indicate whether it is:

- Not started.
- In progress.
- Completed.
- Needs review, where applicable.

The learner should be able to understand their progress at a glance.

The stage status is based on recorded activity, not on assumptions that the learner has mastered the content.

For an existing lesson, retrieve its saved data and populate the appropriate sections.

## 6.4 Strand 1 — Read & Understand

### Purpose

Read the original story and verify comprehension.

### Content

Display or provide access to:

- Original reading passage.
- Lesson title and topic.
- Comprehension quiz status.
- Saved quiz results, if available.

### ChatGPT interaction

ChatGPT should:

1. Present the reading material.
2. Ask comprehension questions.
3. Check the learner's answers.
4. Explain misunderstandings when necessary.

The reading and quiz should primarily happen in the ChatGPT conversation, not through a duplicate app-based teaching interface.

### Completion

When the comprehension activity is completed:

- Record the relevant completion status and score if supported.
- Allow the learner to continue to vocabulary learning.
- Preserve progress if the learner leaves before completing the stage.

The original reading content must remain available for future reviews.

## 6.5 Strand 2 — Discover & Learn

### Purpose

Turn unfamiliar vocabulary from the story into vocabulary the learner can understand, recall, and eventually use.

### App responsibilities

Display a saved vocabulary list associated with the current lesson.

For each item, show relevant information when available:

- Word or expression.
- Meaning.
- Original sentence.
- Explanation.
- Current mastery level.
- Previous error reason.

The learner should be able to distinguish newly saved vocabulary from vocabulary that has already been reviewed.

### ChatGPT interaction

ChatGPT should:

1. Ask which words or expressions the learner found unfamiliar.
2. Explain the selected vocabulary in context.
3. Ask retrieval questions.
4. Evaluate the learner's answers.
5. Save or update the selected vocabulary through MCP.

The learner's own selection should remain the primary source of saved vocabulary.

### Mastery levels

Use four levels:

1. Familiarization.
2. Recognition.
3. Recall.
4. Mastery.

These levels represent the current learning state.

Vocabulary items do not have independent review dates. Their review timing is inherited from the lesson.

### Completion

When the learner finishes the vocabulary activity:

- Save newly selected vocabulary.
- Update existing vocabulary records when appropriate.
- Preserve existing records instead of creating duplicates.
- Mark the stage as completed when the required activity has been completed.

The lesson can still be completed while some vocabulary remains at a low mastery level.

## 6.6 Strand 3 — Write & Improve

### Purpose

Help the learner express ideas in English and improve their writing through feedback and revision.

### Activities

Possible tasks:

- Summarize the original story.
- Write a personal response.
- Describe a related personal experience.
- Use target vocabulary in original sentences.

### Saved information

Display the most recent saved record:

- Original writing.
- Summary of important errors.
- Latest improved writing.
- Current writing mastery level.

The original writing must be preserved.

The improved writing and current error summary may be updated during later reviews.

### ChatGPT interaction

ChatGPT should:

1. Provide a writing prompt.
2. Let the learner produce an initial response.
3. Identify important errors.
4. Explain and correct relevant issues.
5. Allow a bounded revision process.
6. Save the final submission when the learner submits it.

Avoid endless revision loops. Prioritize meaningful improvements over correcting every minor issue.

### Completion

When the learner submits the writing:

- Save the original text if this is the first submission.
- Update the current error summary.
- Update the latest improved version.
- Update the current mastery level based on the available evidence.
- Preserve the lesson's overall review schedule at the lesson level.

## 6.7 Strand 4 — Speak & Repeat

### Purpose

Improve the learner's ability to express familiar ideas more fluently.

### Activity

Use the 4–3–2 speaking technique:

- Four-minute round.
- Three-minute round.
- Two-minute round.

The learner repeats the same topic across the three rounds.

A shorter beginner adaptation may be offered when necessary.

### App responsibilities

Provide a timer with:

- Start.
- Pause.
- Reset.
- Complete.

Show the current round and target duration.

The timer should not automatically mark a speaking activity as successful just because time has elapsed.

### ChatGPT interaction

ChatGPT can help the learner prepare speaking content, simplify difficult expressions, and practice the same topic repeatedly.

If a transcript or audio recording is provided, the tutor may evaluate the aspects that the supplied evidence supports.

Do not claim to measure pronunciation or actual speaking fluency without suitable evidence.

### Saved information

Maintain one current fluency record per lesson:

- Speaking content for the four-minute round.
- Speaking content for the three-minute round.
- Speaking content for the two-minute round.
- Current fluency mastery level.

Update the existing record during later reviews rather than creating duplicate lesson records.

### Completion

The stage can be marked completed when the required practice has been recorded according to the product's completion rules.

Actual mastery must remain a separate assessment.

## 6.8 Lesson Detail actions

Provide a small set of meaningful actions:

**Start Lesson**
- Available when the lesson has not been started.
- Opens or initiates the lesson's ChatGPT learning flow.

**Continue Learning**
- Available when saved work or incomplete stages exist.
- Resumes from the appropriate stage without clearing saved information.

**Review Lesson**
- Available when the lesson is due or when the user chooses to review it.
- Loads the saved lesson context and focuses on weak areas.

**Return to Roadmap**
- Navigates back to the main dashboard.
- Must not erase unsaved work.

The actual mechanism for triggering ChatGPT actions depends on the current integration. Inspect the existing app and MCP capabilities before implementing these actions. Do not invent unsupported host actions or assume that an embedded app can automatically control an unrelated chat conversation.

---

# 7. Lesson Lifecycle and State Management

The application should distinguish between lesson status and mastery.

### Lesson status

- `not_started`
- `in_progress`
- `completed`

Review scheduling is separate from these statuses.

A completed lesson may still be due for review.

### Mastery

Vocabulary, writing, and fluency maintain their own mastery levels.

A lesson may be completed while its vocabulary remains at Familiarization or Recognition.

Do not infer full mastery from completion status.

### Resume behavior

When the user opens a lesson that has already been studied:

1. Retrieve its existing records.
2. Restore the current learning state.
3. Show saved vocabulary and writing information.
4. Identify incomplete activities.
5. Allow the learner to continue or start a review.

Do not reset the lesson merely because it has been opened again.

### Save behavior

- Use stable identifiers.
- Update existing records where appropriate.
- Prevent duplicate lesson and vocabulary records.
- Preserve original writing.
- Update timestamps consistently.
- Show meaningful error feedback if persistence fails.

---

# 8. Google Sheets Data Model

Google Sheets is the initial data store, with four worksheets.

All worksheets share `lesson_id` as the stable relationship key.

## Worksheet 1 — Input

One row per lesson.

Fields:

- `lesson_id`
- `lesson_number`
- `lesson_title`
- `content`
- `created_at`
- `updated_at`
- `lesson_status`
- `last_reviewed_at`
- `next_review_at`
- `review_count`

The original reading passage must remain available for future learning and review.

## Worksheet 2 — Vocabulary

One row per vocabulary item per lesson.

Fields:

- `lesson_id`
- `lesson_number`
- `lesson_title`
- `word`
- `meaning`
- `source_sentence`
- `explanation`
- `error_reason`
- `mastery_level`
- `created_at`
- `updated_at`

Vocabulary does not have its own review schedule.

## Worksheet 3 — Output

One current record per lesson.

Fields:

- `lesson_id`
- `lesson_number`
- `lesson_title`
- `original_text`
- `error_summary`
- `improved_text`
- `mastery_level`
- `created_at`
- `updated_at`

Preserve `original_text`; update the latest improved version as the learner revises their work.

## Worksheet 4 — Fluency

One current record per lesson.

Fields:

- `lesson_id`
- `lesson_number`
- `lesson_title`
- `speaking_4min`
- `speaking_3min`
- `speaking_2min`
- `mastery_level`
- `created_at`
- `updated_at`

The lesson's review schedule is stored in Input rather than duplicated here.

### Data integrity

- Use `lesson_id`, not the lesson title, to link records.
- `lesson_number` is for display and ordering.
- Input, Output, and Fluency should have at most one current record per lesson.
- Vocabulary can have multiple records per lesson.
- Review operations should update existing records.
- Never claim a save or synchronization succeeded unless the corresponding operation succeeded.

---

# 9. MCP Integration Responsibilities

The app should use the MCP capabilities already available in the project.

Before adding tools, inspect the existing implementation and reuse compatible operations.

At a conceptual level, the system needs to support:

- Retrieving the roadmap.
- Retrieving one lesson and its saved records.
- Retrieving lessons due for review.
- Creating or updating lesson progress.
- Saving selected vocabulary.
- Saving writing submissions.
- Saving fluency content.
- Updating lesson review metadata.
- Synchronizing supported Google Sheets data.

These are product capabilities, not a requirement to create a separate MCP tool for every operation.

Choose the smallest reliable set of tools supported by the existing architecture.

The app must remain usable when there is no saved learning data, and it must handle failed storage operations gracefully.

---

# 10. Visual Design Direction

Use the existing visual language shown in the project screenshots as the starting point.

### General style

- Minimalist.
- Black, white, and neutral gray.
- Clear typography.
- Rounded cards with restrained shadows.
- Generous whitespace.
- Strong visual hierarchy.
- Simple line icons.
- No unnecessary gradients, illustrations, or decorative elements.

### Dashboard

Prioritize:
1. Compact action bar.
2. Statistics and activity calendar.
3. Review due card.
4. Vertical learning roadmap.

### Review Queue

Prioritize:
1. Page title and due count.
2. Clear list of lessons.
3. Review dates and status.
4. A straightforward way to open a lesson.

### Lesson Detail

Prioritize:
1. Lesson identity and current status.
2. Saved progress and continuation actions.
3. Four clearly distinguishable strands.
4. Relevant saved learning content.
5. Timers and stage actions where needed.

Avoid designing a large dashboard inside the lesson page. The learner should be able to understand the current task immediately.

Use the existing UI library and design system if the project already has one. Do not introduce another component library without a clear need.

The screenshots supplied with the project should be treated as visual references for the existing dashboard and roadmap, not as a requirement to reproduce every pixel exactly.

---

# 11. Empty, Loading, and Error States

Every data-driven page should handle the following cases.

### No lessons available

Show an empty state explaining that no lessons are available yet.

### No lessons due

Show a positive message and provide a route back to the roadmap.

### No saved vocabulary

Explain that vocabulary will appear after the learner selects and saves expressions during a lesson.

### Lesson in progress

Show the last known stage and offer a continuation action.

### Loading

Provide a clear loading state while retrieving data from MCP or Google Sheets.

### Save or sync failure

Show that the operation failed, preserve the user's work where possible, and allow retrying.

Never replace a failed data request with fabricated sample data in production.

---

# 12. Implementation Approach

Before implementing changes:

1. Inspect the existing repository and identify its framework, routing, UI components, MCP integration, Google Sheets implementation, and current data structures.
2. Compare the existing implementation against this specification.
3. Identify what already works and what is missing.
4. Reuse existing components and tools wherever possible.
5. Propose the smallest implementation plan that delivers the intended user journey.
6. Avoid rewriting working functionality just to match a preferred architecture.

Prioritize a complete vertical slice:

**Open app → View roadmap → Open lesson → Read and learn with ChatGPT → Save results → Return to roadmap → Review the same lesson later.**

Once this flow works reliably, refine the dashboard, statistics, activity calendar, and other secondary details.

Do not add unrelated features or build a complex analytics system before the core learning and review cycle works.

---

# 13. Acceptance Criteria

The initial implementation is successful when:

1. The app opens inside the intended ChatGPT environment.
2. The dashboard retrieves and displays actual learning data.
3. The roadmap displays lessons with correct identifiers and statuses.
4. Selecting a new lesson opens the correct lesson context.
5. Selecting an existing lesson restores saved progress.
6. The learner can complete the four strands with ChatGPT.
7. Learning results are saved to the correct Google Sheets worksheets.
8. Vocabulary records are linked to their source lessons.
9. Original writing is preserved while the latest improved version can be updated.
10. Review dates are managed at the lesson level.
11. The Review Queue shows lessons that are actually due.
12. Completing a review updates the existing lesson records without creating duplicates.
13. Failed save or synchronization operations are reported honestly.
14. The interface remains minimal and understandable.
15. The implementation reuses the existing project architecture wherever practical.

The guiding principle is:

**The roadmap organizes learning. The lesson page preserves context. ChatGPT teaches. MCP persists results. Google Sheets keeps the learning history. Review connects previous knowledge to future learning.**