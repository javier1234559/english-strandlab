import type { LessonBundle } from "@/feature/lab/types";
import { createBlankLesson, nowIso } from "@/feature/lab/lib/lesson";

export interface CurriculumCheckpoint {
  id: string;
  level: string;
  topic: string;
  topicLabel?: string;
  title: string;
  scene?: string;
  order: number;
}

export interface CurriculumLevel {
  id: string;
  label: string;
  title: string;
  checkpoints: string[];
}

export interface CurriculumPath {
  version: number;
  levels: CurriculumLevel[];
}

export interface RoadmapNode {
  checkpoint: CurriculumCheckpoint;
  index: number; // 1-based within level
  bundle: LessonBundle | null;
  status: "not_started" | "in_progress" | "completed" | "due_review";
}

let pathCache: CurriculumPath | null = null;
const checkpointCache = new Map<string, CurriculumCheckpoint>();

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json() as Promise<T>;
}

export async function loadCurriculumPath(): Promise<CurriculumPath> {
  if (pathCache) return pathCache;
  pathCache = await fetchJson<CurriculumPath>("/data/roadmap/path.json");
  return pathCache;
}

export async function loadCheckpoint(
  id: string,
): Promise<CurriculumCheckpoint> {
  const hit = checkpointCache.get(id);
  if (hit) return hit;
  const level = id.split("-")[0]; // a1, a2, b1, b2
  const data = await fetchJson<CurriculumCheckpoint>(
    `/data/roadmap/${level}/checkpoints/${id}.json`,
  );
  checkpointCache.set(id, data);
  return data;
}

export async function loadLevelCheckpoints(
  level: CurriculumLevel,
): Promise<CurriculumCheckpoint[]> {
  const rows = await Promise.all(
    level.checkpoints.map((id) => loadCheckpoint(id)),
  );
  return rows.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function bundleFromCheckpoint(
  cp: CurriculumCheckpoint,
  number: number,
): LessonBundle {
  const base = createBlankLesson({
    title: cp.title,
    number,
    content: cp.scene || "",
  });
  const ts = nowIso();
  return {
    ...base,
    input: {
      ...base.input,
      lesson_id: cp.id,
      lesson_title: cp.title,
      content: cp.scene || "",
      topic: cp.topic,
      topic_label: cp.topicLabel || cp.topic,
      cefr_level: (cp.level || "a1").toUpperCase(),
      created_at: ts,
      updated_at: ts,
    },
  };
}

export function findBundle(
  lessons: LessonBundle[],
  lessonId: string,
): LessonBundle | null {
  return lessons.find((l) => l.input.lesson_id === lessonId) || null;
}
