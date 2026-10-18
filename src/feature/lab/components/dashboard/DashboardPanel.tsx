"use client";

import { useEffect, useState } from "react";
import type { LessonBundle } from "@/feature/lab/types";
import {
  dueLessons,
  heatmapModel,
  masteryCounts,
  type HeatmapModel,
} from "@/feature/lab/lib/stats";
import { StatsCard } from "./StatsCard";
import { ReviewDueCard } from "./ReviewDueCard";
import { TimelineRoadmap } from "./TimelineRoadmap";

export function DashboardPanel({
  lessons,
  syncMsg,
  busy,
  sheetUrl,
  configured,
  onOpenCheckpoint,
  onReview,
  onSync,
  onSetup,
  onExport,
  onImport,
}: {
  lessons: LessonBundle[];
  syncMsg: string;
  busy: boolean;
  sheetUrl: string;
  configured: boolean;
  onOpenCheckpoint: (id: string) => void;
  onReview: () => void;
  onSync: () => void;
  onSetup: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}) {
  const [heat, setHeat] = useState<HeatmapModel | null>(null);
  const counts = masteryCounts(lessons);
  const due = dueLessons(lessons);

  // Date/timezone + local lesson timestamps — compute only on the client.
  useEffect(() => {
    setHeat(heatmapModel(lessons));
  }, [lessons]);

  return (
    <div className="sl-stack">
      {syncMsg ? <p className="sl-sync">{syncMsg}</p> : null}

      <StatsCard counts={counts} heat={heat} />
      <ReviewDueCard dueCount={due.length} onReview={onReview} />
      <TimelineRoadmap lessons={lessons} onOpenCheckpoint={onOpenCheckpoint} />
    </div>
  );
}
