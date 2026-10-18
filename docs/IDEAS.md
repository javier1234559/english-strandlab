# English StrandLab — Project Context & Product Brief

## 1. Project Overview

**Project name:** English StrandLab

**Tagline:** Learn. Experiment. Become Fluent.

English StrandLab is a personal English-learning system designed to help learners turn passive vocabulary into active English through contextual learning, deliberate practice, writing, and speaking.

The project is inspired by Paul Nation's Four Strands framework. It is intended to be an ongoing learning experiment: learn English, track progress, revisit previous lessons, and discover which learning methods work best for the individual learner.

The project should remain practical, lightweight, and easy to maintain. Avoid unnecessary complexity and do not assume that a sophisticated interface or a large technical architecture is required.

## 2. Core Problem

Many English learners spend considerable time reading, studying grammar, and memorizing vocabulary, yet struggle to recall words or use them naturally when writing and speaking.

Another problem is that completing a lesson does not mean the learner has mastered its content. Without reviewing previous lessons, vocabulary and language patterns are easily forgotten.

English StrandLab aims to address both problems:

- Learn vocabulary in meaningful contexts instead of studying isolated word lists.
- Turn unfamiliar vocabulary into language that can be recalled and used.
- Practice writing and speaking using the knowledge acquired.
- Preserve learning history so previous lessons can be revisited.
- Balance new learning with regular review.
- Keep each learning session time-bounded to reduce distraction and overthinking.

## 3. Learning Framework: Paul Nation's Four Strands

Each lesson follows four learning strands.

### Strand 1 — Meaning-Focused Input

The learner reads a story or passage appropriate to their English level.

The learning flow:
1. Present the reading material.
2. Ask comprehension questions.
3. Evaluate the learner's understanding.
4. Clarify confusing passages when necessary.

Reading content should be meaningful, level-appropriate, and useful for learning vocabulary in context.

The learner should not spend excessive time on this strand if reading comprehension is already a strength.

### Strand 2 — Language-Focused Learning

The learner identifies unfamiliar words and expressions from the reading passage.

The learning flow:
1. Ask the learner which words or expressions they do not understand.
2. Explain their meanings in the original context.
3. Show the original sentence and explain relevant usage, collocations, grammar patterns, or nuances.
4. Ask retrieval questions to check understanding.
5. Record the selected vocabulary and relevant learning information.

The learner's own selection should be the primary source of vocabulary to save. The tutor may recommend additional important expressions when appropriate.

Do not automatically save every unfamiliar-looking word. Prioritize useful vocabulary that matches the learner's level and communication goals.

Distinguish between words the learner did not know, words they misunderstood, and words they knew but used incorrectly.

### Strand 3 — Meaning-Focused Output

The learner actively uses English through writing.

Possible activities:
- Summarize the story in their own words.
- Write about a personal experience related to the story.
- Answer questions and express their own opinions.
- Use selected vocabulary in original sentences.

The tutor provides focused feedback, identifies important or recurring errors, and helps the learner improve their writing.

The learner should have an opportunity to revise their work before submitting it.

Preserve the original writing. The latest improved version may replace the previous improved version, but the original must never be overwritten.

### Strand 4 — Fluency Development

The learner practices expressing familiar ideas more fluently.

The preferred activity is the 4–3–2 speaking technique:
- Round 1: Speak about the same topic for four minutes.
- Round 2: Repeat the topic in three minutes.
- Round 3: Repeat the topic in two minutes.

The purpose is to encourage faster retrieval and more fluent expression using familiar language.

The original 4–3–2 activity requires nine minutes of speaking time, excluding preparation. For beginners, a shorter adaptation may be offered when necessary, but it should be clearly distinguished from the original technique.

The tutor may help prepare speaking content and evaluate submitted transcripts or audio when available. Text alone must not be treated as proof of actual speaking fluency or completed speaking duration.

## 4. Time Management

Each learning strand should have a suggested time allocation.

The purpose of time limits is to help learners maintain focus, avoid spending too long on one activity, and make consistent progress.

The time allocation should not be rigidly equal across all strands. It should reflect the learner's current strengths, weaknesses, and learning objectives.

For example:
- A strong reader may need less time for reading comprehension.
- A learner with many unfamiliar words may need more time for vocabulary.
- A learner who struggles to express ideas may need more output practice.
- A learner who understands English but cannot speak comfortably may need more fluency practice.

The system may offer different session lengths, such as 15, 30, and 45 minutes, with suggested allocations for each mode.

Timers should support starting, pausing, resetting, and completing an activity. When time expires, the system should gently encourage the learner to move forward or save their unfinished work. It must not delete work or force an abrupt transition.

These allocations are initial design assumptions to be tested and adjusted, not scientifically established optimal durations.

## 5. Lesson-Based Learning and Review

A completed lesson is not necessarily a mastered lesson.

English StrandLab must distinguish between:
- **Lesson completion:** The learner has completed the intended activities.
- **Mastery:** The learner can recall and use the knowledge reliably.

The system should preserve the relationship between vocabulary, writing, and speaking from the same lesson.

### Review scheduling principle

Review scheduling belongs at the lesson level, not independently at the level of every vocabulary item, writing submission, or speaking exercise.

Each lesson has:
- `last_reviewed_at`
- `next_review_at`
- `review_count`
- `lesson_status`

When a lesson becomes due for review, the learner revisits that lesson and practices the relevant knowledge from its four strands.

The tutor should prioritize weaker vocabulary, recurring writing errors, and speaking topics that need more practice. It does not need to repeat every activity in full on every review.

Review outcomes determine whether the lesson should be reviewed sooner or later.

The initial review intervals may be experimental and adjusted according to actual performance. They should not be treated as universal guarantees of retention.

New lessons and reviews should coexist. Learners should not have to permanently stop learning new content just because older lessons require review.

## 6. Data Storage: Google Sheets

Google Sheets is the initial persistence layer. Data is accessed and updated through MCP tools.

Use four worksheets. Every record must be associated with a stable `lesson_id`.

### Tab 1 — Input

Purpose: Store the source material and lesson metadata.

Suggested columns:
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

Each lesson has one record in this worksheet.

### Tab 2 — Vocabulary

Purpose: Store vocabulary selected from each lesson and its current mastery state.

Each row represents one vocabulary word or expression in a lesson.

Suggested columns:
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

The four mastery levels are:

1. **Familiarization — 1:** The learner is becoming familiar with the word.
2. **Recognition — 2:** The learner can recognize the word and understand its meaning.
3. **Recall — 3:** The learner can retrieve the word or its meaning with less support.
4. **Mastery — 4:** The learner can use the word appropriately in relevant contexts.

These levels describe the current state of learning, not guaranteed permanent retention.

Vocabulary rows do not have their own review dates. Review scheduling is managed by the associated lesson.

### Tab 3 — Output

Purpose: Store the learner's writing and current improvement state.

Each lesson has one record in this worksheet.

Suggested columns:
- `lesson_id`
- `lesson_number`
- `lesson_title`
- `original_text`
- `error_summary`
- `improved_text`
- `mastery_level`
- `created_at`
- `updated_at`

Rules:
- Preserve `original_text` permanently unless the learner explicitly requests otherwise.
- Store the current improved version in `improved_text`.
- The latest review may overwrite `improved_text`.
- Store the current relevant error summary in `error_summary`.
- Use the same four-level mastery concept, interpreted for writing proficiency.

### Tab 4 — Fluency

Purpose: Store speaking practice content and the learner's current fluency mastery state.

Each lesson has one record in this worksheet.

Suggested columns:
- `lesson_id`
- `lesson_number`
- `lesson_title`
- `speaking_4min`
- `speaking_3min`
- `speaking_2min`
- `mastery_level`
- `created_at`
- `updated_at`

The three speaking fields store the corresponding round content or prepared speaking transcript, as appropriate.

Use four mastery levels:
1. Familiarization
2. Recognition
3. Recall
4. Mastery

Interpret these levels for fluency development. Do not claim that text alone proves speaking fluency.

Review dates are stored at the lesson level, not in this worksheet.

## 7. Data Management Rules

- `lesson_id` is the primary identifier linking records across all four worksheets.
- `lesson_number` is a display and ordering field, not the primary key.
- Input, Output, and Fluency have at most one current record per lesson.
- Vocabulary has multiple rows per lesson, one per selected word or expression.
- When reviewing an existing lesson, update the existing records rather than creating duplicates.
- Preserve the original writing.
- Update timestamps consistently.
- If an MCP operation fails, report the failure and allow the operation to be retried.
- Never report that data has been saved unless the storage operation has succeeded.
- Avoid collecting unnecessary data or building a detailed event history unless it becomes necessary.

## 8. Product Responsibilities

The product has three main responsibilities.

### ChatGPT — Learning Tutor

ChatGPT conducts the learning activities:
- Presents reading material and comprehension questions.
- Helps the learner discover and understand vocabulary.
- Guides writing, correction, and revision.
- Prepares and supports speaking practice.
- Conducts lesson reviews.
- Evaluates mastery based on the available evidence.
- Decides which existing knowledge deserves more attention during review.

### English StrandLab App — Learning Organizer

The app organizes the learning journey:
- Displays the learning roadmap.
- Shows lesson status and progress.
- Provides time management tools.
- Displays saved learning information and lesson review status.
- Helps the learner resume an unfinished lesson or revisit a completed one.

The app should complement ChatGPT rather than duplicate the tutor's conversational responsibilities.

### MCP and Google Sheets — Persistence

MCP provides the operations needed to retrieve and update lesson data.

Google Sheets stores the current lesson content, selected vocabulary, writing records, speaking content, and lesson review schedule.

The exact tools and integration details can be decided during implementation. Do not assume that a hosted website automatically becomes an embedded ChatGPT app; any required integration must be verified against the actual environment.

## 9. Product Principles

1. **Practical over complicated:** Build only what supports the learning cycle.
2. **Context over isolated memorization:** Teach vocabulary through meaningful reading and usage.
3. **Active recall over passive exposure:** Ask learners to retrieve and use knowledge.
4. **Consistency over intensity:** Encourage regular, sustainable practice.
5. **Review alongside new learning:** Completing a lesson must not imply permanent mastery.
6. **Learner-centered adaptation:** Allocate effort according to actual needs rather than fixed equal durations.
7. **Preserve meaningful history:** Keep the original writing and enough context to resume learning.
8. **Honest assessment:** Evaluate only what the available answers, text, or audio can support.
9. **Simple persistence:** Start with four Google Sheets worksheets and a small set of reliable MCP operations.
10. **Iterative development:** Validate the complete learning cycle before adding advanced features.

## 10. Current Scope and Priorities

The initial goal is a working end-to-end learning system, not a large educational platform.

Prioritize:
1. Creating and retrieving a lesson.
2. Completing the four learning strands with ChatGPT.
3. Saving vocabulary, writing, and fluency content to the correct worksheet.
4. Marking lesson completion independently from mastery.
5. Reviewing a previous lesson and updating its mastery and review schedule.
6. Displaying the roadmap and allowing the learner to continue learning.

Avoid prematurely introducing:
- Complex adaptive-learning algorithms.
- Independent review schedules for every word.
- Detailed analytics dashboards.
- Unnecessary database layers.
- Excessive UI components.
- Features that do not directly improve learning or review.

The implementation should follow the simplest reliable approach supported by the existing project and tools.

## 11. Expected Collaboration Style

Before making major implementation decisions, understand the existing codebase, project setup, and available integrations.

Do not assume that the next step must be UI design, code generation, or a complete rewrite.

First identify what already exists, what is missing, and what the smallest useful next step would be. Discuss significant trade-offs when necessary, and avoid implementing additional complexity without a clear reason.

The central objective is to help a learner repeatedly complete this cycle:

**Learn → Understand → Use → Practice Fluency → Save → Review → Continue Learning.**