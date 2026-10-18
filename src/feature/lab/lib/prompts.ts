import type { LessonBundle, StrandId } from "@/feature/lab/types";
import { STRAND_META } from "@/feature/lab/types";

function lessonHeader(bundle: LessonBundle) {
  const i = bundle.input;
  return [
    `Lesson ID: ${i.lesson_id}`,
    `Title: ${i.lesson_title}`,
    `Level: ${(i.cefr_level || "").toUpperCase() || "—"}`,
    `Topic: ${i.topic_label || i.topic || "—"}`,
  ].join("\n");
}

export function buildStrandPrompt(
  bundle: LessonBundle,
  strand: StrandId,
): string {
  const meta = STRAND_META[strand];
  const base = [
    "You are my English tutor for English StrandLab.",
    lessonHeader(bundle),
    "",
    `Strand: ${meta.title}`,
    meta.blurb,
    "",
  ];

  if (strand === "input") {
    return [
      ...base,
      "Help me understand the story and its meaning before focusing on individual words.",
      "Ask comprehension questions in ChatGPT. Do not invent a separate quiz UI.",
      "",
      "Lesson content:",
      bundle.input.content || "(no content saved yet)",
      "",
      "When we finish, I will save notes in the app (Input sheet).",
    ].join("\n");
  }

  if (strand === "language") {
    const words = bundle.vocabulary
      .map((v) => `- ${v.word}: ${v.meaning}`)
      .join("\n");
    return [
      ...base,
      "Help me identify useful expressions, understand them in context, and practice recalling them.",
      "Suggest only high-value vocabulary worth saving.",
      "",
      "Source content:",
      bundle.input.content || "(no content)",
      "",
      "Already saved vocabulary:",
      words || "(none yet)",
      "",
      "I will save each item in the app Vocabulary sheet: word, meaning, source_sentence, explanation, mastery_level.",
    ].join("\n");
  }

  if (strand === "output") {
    return [
      ...base,
      "Help me write in English, identify important errors, and improve my response.",
      "Keep my original writing separate from the improved version.",
      "",
      "Original writing:",
      bundle.output?.original_text || "(empty — I will write first)",
      "",
      "Error summary (if any):",
      bundle.output?.error_summary || "(none)",
      "",
      "Latest improved writing:",
      bundle.output?.improved_text || "(none)",
      "",
      "I will save original_text, error_summary, improved_text, and mastery_level in the Output sheet.",
    ].join("\n");
  }

  return [
    ...base,
    "Help me practice fluency with the 4–3–2 technique (or a shorter beginner adaptation).",
    "Focus on faster, more natural expression of familiar ideas from this lesson.",
    "",
    "Topic / content reminder:",
    bundle.input.content.slice(0, 600) || bundle.input.lesson_title,
    "",
    "Saved speaking notes:",
    `4 min: ${bundle.fluency?.speaking_4min || "(empty)"}`,
    `3 min: ${bundle.fluency?.speaking_3min || "(empty)"}`,
    `2 min: ${bundle.fluency?.speaking_2min || "(empty)"}`,
    "",
    "I will save speaking_4min / speaking_3min / speaking_2min and mastery_level in the Fluency sheet.",
  ].join("\n");
}

export function buildLessonPrompt(bundle: LessonBundle): string {
  return [
    "You are my English tutor for English StrandLab.",
    lessonHeader(bundle),
    `Status: ${bundle.input.lesson_status}`,
    "",
    "Lesson content:",
    bundle.input.content || "(no content saved yet)",
    "",
    "Guide me through Nation's four strands for this lesson:",
    "1) Meaning-focused input",
    "2) Language-focused learning",
    "3) Meaning-focused output",
    "4) Fluency development",
    "",
    "I will save results in the StrandLab app / Google Sheets after each strand.",
  ].join("\n");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
