"use client";

import type { LessonBundle } from "@/feature/lab/types";
import { dueLessons } from "@/feature/lab/lib/stats";

export function ReviewPanel({
  lessons,
  onBack,
  onOpen,
}: {
  lessons: LessonBundle[];
  onBack: () => void;
  onOpen: (lessonId: string) => void;
}) {
  const due = dueLessons(lessons);

  return (
    <div className="sl-stack">
      <section className="sl-card">
        <button type="button" className="sl-ghost" onClick={onBack}>
          ← Dashboard
        </button>
        <h2 className="sl-h2">Ôn tập tới hạn</h2>
        <p className="sl-muted">
          Ôn theo bài học để giữ vocabulary, writing và speaking trong cùng ngữ
          cảnh — không phải hàng đợi flashcard rời.
        </p>
        <p className="sl-review-count">
          <b>{due.length}</b> bài cần ôn
        </p>
      </section>

      {due.length === 0 ? (
        <div className="sl-card sl-muted">
          Không có bài tới hạn. Quay lại roadmap để học bài mới.
        </div>
      ) : (
        <ul className="sl-lesson-list">
          {due.map((b) => (
            <li key={b.input.lesson_id}>
              <button
                type="button"
                className="sl-lesson-card"
                onClick={() => onOpen(b.input.lesson_id)}
              >
                <strong className="sl-lesson-title">
                  #{b.input.lesson_number} · {b.input.lesson_title}
                </strong>
                <div className="sl-lesson-meta">
                  <span>
                    {[b.input.topic_label || b.input.topic, b.input.cefr_level]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {b.input.last_reviewed_at ? (
                    <span>
                      Last reviewed{" "}
                      {new Date(b.input.last_reviewed_at).toLocaleDateString()}
                    </span>
                  ) : null}
                  {b.input.next_review_at ? (
                    <span>
                      Due{" "}
                      {new Date(b.input.next_review_at).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
