"use client";

export function ReviewDueCard({
  dueCount,
  onReview,
}: {
  dueCount: number;
  onReview: () => void;
}) {
  return (
    <section className="sl-card sl-review-card">
      <div>
        <h2 className="sl-section-title">Ôn tập tới hạn</h2>
        {dueCount > 0 ? (
          <p className="sl-review-count">
            <b>{dueCount}</b> bài cần ôn
          </p>
        ) : (
          <p className="sl-muted">
            Bạn đang theo kịp. Tiếp tục bài tiếp theo trên roadmap.
          </p>
        )}
      </div>
      <button
        type="button"
        className="sl-btn-dark"
        disabled={dueCount === 0}
        onClick={onReview}
      >
        Ôn ngay
      </button>
    </section>
  );
}
