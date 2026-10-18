"use client";

import { useEffect, useState } from "react";
import type { LessonBundle } from "@/feature/lab/types";
import { effectiveStatus } from "@/feature/lab/lib/lesson";
import {
  findBundle,
  loadCurriculumPath,
  loadLevelCheckpoints,
  type CurriculumCheckpoint,
  type CurriculumLevel,
} from "@/feature/lab/lib/curriculum";

type LevelBlock = {
  level: CurriculumLevel;
  nodes: {
    checkpoint: CurriculumCheckpoint;
    index: number;
    bundle: LessonBundle | null;
    status: ReturnType<typeof effectiveStatus> | "not_started";
  }[];
};

export function TimelineRoadmap({
  lessons,
  onOpenCheckpoint,
}: {
  lessons: LessonBundle[];
  onOpenCheckpoint: (checkpointId: string) => void;
}) {
  const [blocks, setBlocks] = useState<LevelBlock[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path = await loadCurriculumPath();
        const next: LevelBlock[] = [];
        for (const level of path.levels) {
          const cps = await loadLevelCheckpoints(level);
          next.push({
            level,
            nodes: cps.map((checkpoint, i) => {
              const bundle = findBundle(lessons, checkpoint.id);
              const status = bundle
                ? effectiveStatus(bundle.input)
                : "not_started";
              return {
                checkpoint,
                index: i + 1,
                bundle,
                status,
              };
            }),
          });
        }
        if (!cancelled) setBlocks(next);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không tải được roadmap");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessons]);

  if (error) {
    return <div className="sl-card sl-muted">{error}</div>;
  }

  if (!blocks.length) {
    return <div className="sl-card sl-muted">Đang tải roadmap…</div>;
  }

  return (
    <div className="sl-roadmap">
      {blocks.map((block) => (
        <section key={block.level.id} className="sl-path-section">
          <header className="sl-path-head">
            <span className="sl-path-badge">{block.level.label}</span>
            <h3 className="sl-path-title">{block.level.title}</h3>
            <div className="sl-path-rule" />
          </header>

          <ol className="sl-timeline">
            {block.nodes.map((node, i) => {
              const side = i % 2 === 0 ? "right" : "left";
              const done =
                node.status === "completed" || node.status === "due_review";
              const topic =
                node.bundle?.input.topic_label ||
                node.checkpoint.topicLabel ||
                node.checkpoint.topic;
              const levelLabel = (
                node.bundle?.input.cefr_level ||
                node.checkpoint.level ||
                ""
              ).toUpperCase();
              const statusLabel =
                node.status === "due_review"
                  ? "Review"
                  : node.status === "completed"
                    ? "Done"
                    : node.status === "in_progress"
                      ? "In progress"
                      : null;
              const meta = [topic, levelLabel, statusLabel]
                .filter(Boolean)
                .join(" · ");

              return (
                <li
                  key={node.checkpoint.id}
                  className={`sl-timeline-item ${side}`}
                >
                  <button
                    type="button"
                    className="sl-timeline-hit"
                    onClick={() => onOpenCheckpoint(node.checkpoint.id)}
                  >
                    <span
                      className={`sl-node${done ? " done" : ""}${
                        node.status === "in_progress" ? " current" : ""
                      }${node.status === "due_review" ? " review" : ""}`}
                    >
                      {done ? (
                        <svg viewBox="0 0 24 24" aria-hidden>
                          <path
                            d="M9.2 16.2 4.8 11.8l1.4-1.4 3 3 8-8 1.4 1.4-9.4 9.4z"
                            fill="currentColor"
                          />
                        </svg>
                      ) : (
                        node.index
                      )}
                    </span>
                    <span className="sl-timeline-copy">
                      <strong>{node.checkpoint.title}</strong>
                      <span className="sl-muted">{meta}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
