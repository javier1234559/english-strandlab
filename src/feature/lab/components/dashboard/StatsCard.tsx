"use client";

import { MASTERY_VI, type MasteryLevel } from "@/feature/lab/types";
import type { HeatmapModel, MasteryCounts } from "@/feature/lab/lib/stats";

const ORDER: MasteryLevel[] = [1, 2, 3, 4];

export function StatsCard({
  counts,
  heat,
}: {
  counts: MasteryCounts;
  heat: HeatmapModel | null;
}) {
  return (
    <section className="sl-card sl-stats-card">
      <h2 className="sl-section-title">Thống kê tổng</h2>
      <div className="sl-stat-grid">
        {ORDER.map((level) => (
          <div key={level} className="sl-stat-tile">
            <div className="sl-stat-label">{MASTERY_VI[level]}</div>
            <div className="sl-stat-value">{counts[level]}</div>
          </div>
        ))}
      </div>

      {!heat ? (
        <p className="sl-muted">Đang tải lịch học…</p>
      ) : (
        <>
          <div className="sl-heat-head">
            <strong>{heat.year}</strong>
            <span>
              Chuỗi hiện tại <b>{heat.current} ngày</b>
            </span>
            <span>
              Dài nhất <b>{heat.longest} ngày</b>
            </span>
            <span>
              <b>{heat.activeDays}</b> ngày học
            </span>
          </div>

          <div
            className="sl-heat"
            role="img"
            aria-label={`Activity calendar ${heat.year}`}
          >
            <div className="sl-heat-dows">
              {heat.dows.map((d, i) =>
                i % 2 === 0 ? (
                  <span key={d}>{d}</span>
                ) : (
                  <span key={d} className="sl-heat-dow-spacer" />
                ),
              )}
            </div>
            <div className="sl-heat-body">
              <div className="sl-heat-months">
                {heat.months.map((m) => (
                  <span
                    key={`${m.label}-${m.week}`}
                    style={{ gridColumn: m.week + 1 }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
              <div
                className="sl-heat-grid"
                style={{ gridTemplateColumns: `repeat(${heat.weeks}, 11px)` }}
              >
                {Array.from({ length: heat.weeks }).map((_, week) =>
                  Array.from({ length: 7 }).map((__, dow) => {
                    const cell = heat.cells[week * 7 + dow];
                    if (!cell) return null;
                    const cls =
                      cell.level < 0
                        ? "sl-heat-cell muted"
                        : `sl-heat-cell l${cell.level}`;
                    return (
                      <div
                        key={`${week}-${dow}`}
                        className={cls}
                        title={
                          cell.key
                            ? `${cell.key}: ${cell.score} hoạt động`
                            : undefined
                        }
                      />
                    );
                  }),
                )}
              </div>
              <div className="sl-heat-legend">
                <span>Ít</span>
                <i className="sl-heat-cell l0" />
                <i className="sl-heat-cell l1" />
                <i className="sl-heat-cell l2" />
                <i className="sl-heat-cell l3" />
                <i className="sl-heat-cell l4" />
                <span>Nhiều</span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
