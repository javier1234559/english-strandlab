"use client";

import { useState } from "react";
import type {
  LessonBundle,
  LessonStatus,
  MasteryLevel,
  StrandId,
  VocabItem,
} from "@/feature/lab/types";
import { MASTERY_LABELS, STRAND_META } from "@/feature/lab/types";
import { nowIso, uid, upsertVocab } from "@/feature/lab/lib/lesson";
import {
  buildLessonPrompt,
  buildStrandPrompt,
  copyText,
} from "@/feature/lab/lib/prompts";
import { useStrandTimer } from "@/feature/lab/hooks/useStrandTimer";

const STRANDS: StrandId[] = ["input", "language", "output", "fluency"];

const STRAND_INDEX: Record<StrandId, number> = {
  input: 1,
  language: 2,
  output: 3,
  fluency: 4,
};

const STATUS_LABEL: Record<LessonStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  due_review: "Due for review",
};

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ─── Icons ──────────────────────────────────────── */

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" width="13" height="13" aria-hidden>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="2" aria-hidden>
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

/* ─── Main Panel ─────────────────────────────────── */

export function LessonPanel({
  bundle,
  busy,
  onBack,
  onChange,
  onSave,
}: {
  bundle: LessonBundle;
  busy: boolean;
  onBack: () => void;
  onChange: (next: LessonBundle) => void;
  onSave: () => void;
  /** Reserved for future use */
  onComplete?: () => void;
}) {
  const [copied, setCopied] = useState("");
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const level = (bundle.input.cefr_level || "").toUpperCase() || "A1";
  const topic = bundle.input.topic_label || bundle.input.topic || "General";
  const levelPath =
    level === "A1"
      ? "Beginner"
      : level === "A2"
        ? "Elementary"
        : level === "B1"
          ? "Intermediate"
          : level === "B2"
            ? "Upper-Intermediate"
            : "Advanced";

  const flashCopy = (key: string) => {
    setCopied(key);
    window.setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1600);
  };

  const copyLesson = async () => {
    const ok = await copyText(buildLessonPrompt(bundle));
    if (ok) flashCopy("lesson");
  };

  return (
    <div className="sl-lesson-new">
      {/* Back */}
      <button type="button" className="sl-back" onClick={onBack}>
        ← Roadmap
      </button>

      {/* ── Hero card ── */}
      <div className="sl-lesson-hero-card">
        {/* Top bar: crumb + copy button */}
        <div className="sl-lesson-topbar">
          <p className="sl-lesson-crumb">
            {level} · {levelPath} path · Lesson{" "}
            {String(bundle.input.lesson_number).padStart(2, "0")}
          </p>
          <button
            type="button"
            className="sl-btn-outline"
            onClick={() => void copyLesson()}
          >
            <IconCopy />
            {copied === "lesson" ? "Copied!" : "Copy lesson prompt"}
          </button>
        </div>

        {/* Title */}
        <h1 className="sl-lesson-h1-new">{bundle.input.lesson_title}</h1>

        {/* Meta tags */}
        <div className="sl-lesson-tags">
          <span className="sl-lesson-tag">
            <IconUsers />
            {topic}
          </span>
          <span className="sl-tag-badge">{level}</span>
          <span className="sl-lesson-tag">
            <IconClock />
            ~30 min
          </span>
          <span
            className={`sl-tag-status ${bundle.input.lesson_status}`}
          >
            {STATUS_LABEL[bundle.input.lesson_status]}
          </span>
        </div>

        {/* Dates */}
        <div className="sl-lesson-dates">
          <span>
            Last learned:{" "}
            <b>{formatDate(bundle.input.last_reviewed_at)}</b>
          </span>
          <span>
            Next review:{" "}
            <b>{formatDate(bundle.input.next_review_at)}</b>
          </span>
        </div>

        {/* Story preview */}
        <div className="sl-story-section">
          <p className={`sl-story-text${storyExpanded ? " expanded" : ""}`}>
            {bundle.input.content ||
              "No lesson content yet. Click Edit to add the lesson text."}
          </p>
          <div className="sl-story-footer">
            <button
              type="button"
              className={`sl-story-expand${storyExpanded ? " open" : ""}`}
              onClick={() => setStoryExpanded((e) => !e)}
            >
              <IconChevron />
              {storyExpanded ? "Hide story text" : "View full story text"}
            </button>
            <button
              type="button"
              className="sl-edit-btn"
              onClick={() => setEditMode((e) => !e)}
            >
              <IconEdit />
              {editMode ? "Done" : "Edit"}
            </button>
          </div>

          {/* Inline edit area */}
          {editMode && (
            <div className="sl-edit-area">
              <label className="sl-notes-label">
                Lesson title
                <input
                  type="text"
                  className="sl-notes-input"
                  value={bundle.input.lesson_title}
                  disabled={busy}
                  onChange={(e) =>
                    onChange({
                      ...bundle,
                      input: {
                        ...bundle.input,
                        lesson_title: e.target.value,
                        updated_at: nowIso(),
                      },
                    })
                  }
                />
              </label>
              <label className="sl-notes-label">
                Story / Lesson text
                <textarea
                  className="sl-notes-textarea"
                  rows={8}
                  value={bundle.input.content}
                  disabled={busy}
                  placeholder="Paste or write the lesson passage here…"
                  onChange={(e) =>
                    onChange({
                      ...bundle,
                      input: {
                        ...bundle.input,
                        content: e.target.value,
                        updated_at: nowIso(),
                        lesson_status:
                          bundle.input.lesson_status === "not_started"
                            ? "in_progress"
                            : bundle.input.lesson_status,
                      },
                    })
                  }
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ── Strand cards ── */}
      {STRANDS.map((id) => (
        <StrandCard
          key={id}
          strand={id}
          bundle={bundle}
          busy={busy}
          copied={copied}
          onFlashCopy={flashCopy}
          onChange={onChange}
          onSave={onSave}
        />
      ))}

      {/* Mark completed lives inside the lesson header card edit area only */}
    </div>
  );
}

/* ─── Strand Card ────────────────────────────────── */

function StrandCard({
  strand,
  bundle,
  busy,
  copied,
  onFlashCopy,
  onChange,
  onSave,
}: {
  strand: StrandId;
  bundle: LessonBundle;
  busy: boolean;
  copied: string;
  onFlashCopy: (key: string) => void;
  onChange: (b: LessonBundle) => void;
  onSave: () => void;
}) {
  const meta = STRAND_META[strand];
  const num = STRAND_INDEX[strand];
  const timer = useStrandTimer(strand);

  const copy = async () => {
    const ok = await copyText(buildStrandPrompt(bundle, strand));
    if (ok) onFlashCopy(strand);
  };

  const lastUpdated =
    strand === "output"
      ? bundle.output?.updated_at ?? bundle.input.updated_at
      : strand === "fluency"
        ? bundle.fluency?.updated_at ?? bundle.input.updated_at
        : bundle.input.updated_at;

  return (
    <div className="sl-strand-new">
      {/* ── Row 1: number + title/description ── */}
      <div className="sl-strand-top">
        <div className="sl-strand-num">{num}</div>
        <div className="sl-strand-info">
          <h2>{meta.title}</h2>
          <p>{meta.blurb}</p>
        </div>
      </div>

      {/* ── Row 2: timer + actions (right-aligned) ── */}
      <div className="sl-strand-controls">
        {/* Timer display */}
        <span className={`sl-timer-display${timer.expired ? " expired" : ""}`}>
          <IconClock />
          {timer.label}
        </span>

        {/* Timer preset */}
        <select
          className="sl-timer-preset"
          value={timer.minutes}
          onChange={(e) => timer.setMinutes(Number(e.target.value))}
          aria-label="Timer minutes"
        >
          {timer.presets.map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>

        {/* Start / Pause */}
        <button
          type="button"
          className="sl-btn-start"
          onClick={timer.running ? timer.pause : timer.start}
        >
          {timer.running ? (
            <>
              <IconPause /> Pause
            </>
          ) : (
            <>
              <IconPlay /> Start
            </>
          )}
        </button>

        {/* Reset */}
        <button type="button" className="sl-btn-outline" onClick={timer.reset}>
          <IconReset />
          Reset
        </button>

        {/* Copy prompt */}
        <button
          type="button"
          className="sl-btn-outline"
          onClick={() => void copy()}
        >
          <IconCopy />
          {copied === strand ? "Copied!" : "Copy prompt"}
        </button>
      </div>

      {/* ── Strand content ── */}
      {strand === "input" && (
        <InputContent bundle={bundle} busy={busy} onChange={onChange} />
      )}
      {strand === "language" && (
        <LanguageContent bundle={bundle} busy={busy} onChange={onChange} />
      )}
      {strand === "output" && (
        <OutputContent bundle={bundle} busy={busy} onChange={onChange} />
      )}
      {strand === "fluency" && (
        <FluencyContent bundle={bundle} busy={busy} onChange={onChange} />
      )}

      {/* ── Card footer ── */}
      <div className="sl-card-footer">
        <p className="sl-card-footer-meta">
          {lastUpdated ? `Last updated: ${formatDate(lastUpdated)}` : ""}
        </p>
        <div className="sl-card-footer-actions">
          <button
            type="button"
            className="sl-btn-cancel"
            disabled={busy}
            onClick={() => {
              /* reset not yet implemented — acts as noop */
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="sl-btn-save"
            disabled={busy}
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Strand 1: Input (notes) ────────────────────── */

function InputContent({
  bundle,
  busy,
  onChange: _onChange,
}: {
  bundle: LessonBundle;
  busy: boolean;
  onChange: (b: LessonBundle) => void;
}) {
  // Local notes state — future: persist to a dedicated field
  const [notes, setNotes] = useState("");

  return (
    <label className="sl-notes-label">
      Notes (optional)
      <textarea
        className="sl-notes-textarea"
        placeholder="Write your notes here..."
        value={notes}
        disabled={busy}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
      />
    </label>
  );
}

/* ─── Strand 2: Language (vocab table) ──────────── */

function LanguageContent({
  bundle,
  busy,
  onChange,
}: {
  bundle: LessonBundle;
  busy: boolean;
  onChange: (b: LessonBundle) => void;
}) {
  const blank = (): VocabItem => ({
    lesson_id: bundle.input.lesson_id,
    lesson_number: bundle.input.lesson_number,
    lesson_title: bundle.input.lesson_title,
    word: "",
    meaning: "",
    source_sentence: "",
    explanation: "",
    error_reason: "",
    mastery_level: 1,
    created_at: nowIso(),
    updated_at: nowIso(),
    row_id: uid("voc"),
  });

  const addRow = () => {
    onChange({
      ...bundle,
      vocabulary: [...bundle.vocabulary, blank()],
      input: { ...bundle.input, updated_at: nowIso() },
    });
  };

  const patch = (rowId: string | undefined, next: Partial<VocabItem>) => {
    onChange({
      ...bundle,
      vocabulary: bundle.vocabulary.map((x) =>
        x.row_id === rowId ? { ...x, ...next, updated_at: nowIso() } : x,
      ),
    });
  };

  const remove = (rowId: string | undefined, word: string) => {
    if (!window.confirm(`Remove "${word || "this item"}"?`)) return;
    onChange({
      ...bundle,
      vocabulary: bundle.vocabulary.filter((x) => x.row_id !== rowId),
      input: { ...bundle.input, updated_at: nowIso() },
    });
  };

  return (
    <div className="sl-vocab-section">
      <p className="sl-vocab-section-label">Vocabulary list</p>

      <div className="sl-vocab-wrap">
        <table className="sl-vocab-tbl">
          <thead>
            <tr>
              <th>
                <input type="checkbox" aria-label="Select all" />
              </th>
              <th>Word / Phrase</th>
              <th>Meaning (VN)</th>
              <th>Source sentence</th>
              <th>Explanation</th>
              <th>Error reason</th>
              <th>Level</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {bundle.vocabulary.map((v) => (
              <tr key={v.row_id || v.word}>
                <td>
                  <input type="checkbox" aria-label={`Select ${v.word}`} />
                </td>
                <td>
                  <input
                    className="sl-vocab-tbl-input"
                    value={v.word}
                    placeholder="word…"
                    disabled={busy}
                    onChange={(e) =>
                      patch(v.row_id, { word: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    className="sl-vocab-tbl-input"
                    value={v.meaning}
                    placeholder="meaning…"
                    disabled={busy}
                    onChange={(e) =>
                      patch(v.row_id, { meaning: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    className="sl-vocab-tbl-input"
                    value={v.source_sentence}
                    placeholder="source sentence…"
                    disabled={busy}
                    onChange={(e) =>
                      patch(v.row_id, {
                        source_sentence: e.target.value,
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    className="sl-vocab-tbl-input"
                    value={v.explanation}
                    placeholder="explanation…"
                    disabled={busy}
                    onChange={(e) =>
                      patch(v.row_id, { explanation: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    className="sl-vocab-tbl-input"
                    value={v.error_reason}
                    placeholder="-"
                    disabled={busy}
                    onChange={(e) =>
                      patch(v.row_id, { error_reason: e.target.value })
                    }
                  />
                </td>
                <td>
                  <select
                    value={v.mastery_level}
                    disabled={busy}
                    onChange={(e) =>
                      patch(v.row_id, {
                        mastery_level: Number(
                          e.target.value,
                        ) as MasteryLevel,
                      })
                    }
                  >
                    {([1, 2, 3, 4] as MasteryLevel[]).map((n) => (
                      <option key={n} value={n}>
                        {n}. {MASTERY_LABELS[n]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className="sl-vocab-del-btn"
                    disabled={busy}
                    onClick={() => remove(v.row_id, v.word)}
                    aria-label={`Remove ${v.word}`}
                  >
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))}

            {bundle.vocabulary.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    color: "#aaa",
                    padding: "14px 10px",
                    fontSize: "0.82rem",
                  }}
                >
                  No vocabulary saved yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        className="sl-add-vocab-btn"
        disabled={busy}
        onClick={addRow}
      >
        <IconPlus />
        Add vocabulary item
      </button>
    </div>
  );
}

/* ─── Strand 3: Output (3 columns) ──────────────── */

function OutputContent({
  bundle,
  busy,
  onChange,
}: {
  bundle: LessonBundle;
  busy: boolean;
  onChange: (b: LessonBundle) => void;
}) {
  const output = bundle.output!;
  const locked = Boolean(output.original_text);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Original writing */}
      <label className="sl-notes-label">
        1. Original writing
        <textarea
          className="sl-notes-textarea"
          value={output.original_text}
          disabled={busy || locked}
          placeholder="Write your original answer here..."
          rows={4}
          onChange={(e) =>
            onChange({
              ...bundle,
              output: { ...output, original_text: e.target.value, updated_at: nowIso() },
            })
          }
        />
        {locked && (
          <span style={{ fontSize: "0.72rem", color: "#aaa" }}>
            Original locked after first save.
          </span>
        )}
      </label>

      {/* Error summary */}
      <label className="sl-notes-label">
        2. Error summary
        <textarea
          className="sl-notes-textarea"
          value={output.error_summary}
          disabled={busy}
          placeholder="Main errors from ChatGPT..."
          rows={3}
          onChange={(e) =>
            onChange({
              ...bundle,
              output: { ...output, error_summary: e.target.value, updated_at: nowIso() },
            })
          }
        />
      </label>

      {/* Improved writing */}
      <label className="sl-notes-label">
        3. Improved writing
        <textarea
          className="sl-notes-textarea"
          value={output.improved_text}
          disabled={busy}
          placeholder="Write the improved version here..."
          rows={4}
          onChange={(e) =>
            onChange({
              ...bundle,
              output: { ...output, improved_text: e.target.value, updated_at: nowIso() },
            })
          }
        />
      </label>

      {/* Writing level */}
      <div className="sl-level-row">
        <span>Writing level</span>
        <select
          className="sl-level-select"
          value={output.mastery_level}
          disabled={busy}
          onChange={(e) =>
            onChange({
              ...bundle,
              output: {
                ...output,
                mastery_level: Number(e.target.value) as MasteryLevel,
                updated_at: nowIso(),
              },
            })
          }
        >
          {([1, 2, 3, 4] as MasteryLevel[]).map((n) => (
            <option key={n} value={n}>
              {n}. {MASTERY_LABELS[n]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ─── Strand 4: Fluency (3 columns) ─────────────── */

function FluencyContent({
  bundle,
  busy,
  onChange,
}: {
  bundle: LessonBundle;
  busy: boolean;
  onChange: (b: LessonBundle) => void;
}) {
  const fluency = bundle.fluency!;

  const rounds: { key: "speaking_4min" | "speaking_3min" | "speaking_2min"; label: string }[] = [
    { key: "speaking_4min", label: "4-minute round" },
    { key: "speaking_3min", label: "3-minute round" },
    { key: "speaking_2min", label: "2-minute round" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {rounds.map(({ key, label }) => (
        <label key={key} className="sl-notes-label">
          {label}
          <textarea
            className="sl-notes-textarea"
            value={fluency[key]}
            disabled={busy}
            placeholder="Tips / key points / transcript..."
            rows={4}
            onChange={(e) =>
              onChange({
                ...bundle,
                fluency: { ...fluency, [key]: e.target.value, updated_at: nowIso() },
              })
            }
          />
        </label>
      ))}

      {/* Fluency level */}
      <div className="sl-level-row">
        <span>Fluency level</span>
        <select
          className="sl-level-select"
          value={fluency.mastery_level}
          disabled={busy}
          onChange={(e) =>
            onChange({
              ...bundle,
              fluency: {
                ...fluency,
                mastery_level: Number(e.target.value) as MasteryLevel,
                updated_at: nowIso(),
              },
            })
          }
        >
          {([1, 2, 3, 4] as MasteryLevel[]).map((n) => (
            <option key={n} value={n}>
              {n}. {MASTERY_LABELS[n]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
