import type { LessonBundle, MasteryLevel } from "@/feature/lab/types";
import { effectiveStatus } from "@/feature/lab/lib/lesson";

export type MasteryCounts = Record<MasteryLevel, number>;

export function masteryCounts(lessons: LessonBundle[]): MasteryCounts {
  const counts: MasteryCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const lesson of lessons) {
    for (const v of lesson.vocabulary) {
      const m = v.mastery_level;
      if (m === 1 || m === 2 || m === 3 || m === 4) counts[m] += 1;
    }
  }
  return counts;
}

export function dueLessons(lessons: LessonBundle[]): LessonBundle[] {
  return lessons
    .filter((l) => effectiveStatus(l.input) === "due_review")
    .sort((a, b) => {
      const ta = new Date(a.input.next_review_at || 0).getTime();
      const tb = new Date(b.input.next_review_at || 0).getTime();
      return ta - tb;
    });
}

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12);
  dt.setDate(dt.getDate() + days);
  return todayKey(dt);
}

function mondayIndex(d: Date) {
  return (d.getDay() + 6) % 7;
}

function heatLevel(score: number) {
  if (!score) return 0;
  if (score <= 1) return 1;
  if (score <= 2) return 2;
  if (score <= 4) return 3;
  return 4;
}

/** Activity from lesson created/updated/reviewed timestamps (no fake history). */
export function activityMap(lessons: LessonBundle[]): Record<string, number> {
  const map: Record<string, number> = {};
  const bump = (iso: string) => {
    if (!iso) return;
    const t = new Date(iso);
    if (!Number.isFinite(t.getTime())) return;
    const key = todayKey(t);
    map[key] = (map[key] || 0) + 1;
  };
  for (const lesson of lessons) {
    bump(lesson.input.created_at);
    bump(lesson.input.updated_at);
    bump(lesson.input.last_reviewed_at);
    for (const v of lesson.vocabulary) {
      bump(v.created_at);
      bump(v.updated_at);
    }
  }
  return map;
}

export function currentStreak(map: Record<string, number>) {
  const today = todayKey();
  const yesterday = addDays(today, -1);
  let cursor =
    (map[today] || 0) > 0
      ? today
      : (map[yesterday] || 0) > 0
        ? yesterday
        : null;
  if (!cursor) return 0;
  let n = 0;
  while ((map[cursor] || 0) > 0) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function longestStreak(map: Record<string, number>) {
  const days = Object.keys(map)
    .filter((k) => (map[k] || 0) > 0)
    .sort();
  if (!days.length) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === addDays(days[i - 1], 1)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

export interface HeatCell {
  key: string;
  inYear: boolean;
  empty: boolean;
  future: boolean;
  score: number;
  level: number;
  month: number;
  week: number;
}

export interface HeatmapModel {
  year: number;
  cells: HeatCell[];
  weeks: number;
  months: { week: number; label: string }[];
  dows: string[];
  current: number;
  longest: number;
  activeDays: number;
}

export function heatmapModel(
  lessons: LessonBundle[],
  year?: number,
): HeatmapModel {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const y = year ?? now.getFullYear();
  const map = activityMap(lessons);

  const jan1 = new Date(y, 0, 1, 12);
  const dec31 = new Date(y, 11, 31, 12);
  const start = new Date(jan1);
  start.setDate(jan1.getDate() - mondayIndex(jan1));
  const end = new Date(dec31);
  end.setDate(dec31.getDate() + (6 - mondayIndex(dec31)));

  const cells: HeatCell[] = [];
  const cursor = new Date(start);
  let i = 0;
  while (cursor <= end) {
    const key = todayKey(cursor);
    const inYear = cursor.getFullYear() === y;
    const future = inYear && cursor > now;
    const score = !inYear || future ? 0 : map[key] || 0;
    cells.push({
      key: inYear ? key : "",
      inYear,
      empty: !inYear,
      future,
      score,
      level: !inYear ? -2 : future ? -1 : heatLevel(score),
      month: cursor.getMonth(),
      week: Math.floor(i / 7),
    });
    cursor.setDate(cursor.getDate() + 1);
    i += 1;
  }

  const weeks = Math.floor(cells.length / 7);
  const months: { week: number; label: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const first = cells.slice(w * 7, w * 7 + 7).find((c) => c.inYear);
    if (!first) continue;
    if (first.month !== lastMonth) {
      months.push({ week: w, label: "T" + (first.month + 1) });
      lastMonth = first.month;
    }
  }

  const yearMap: Record<string, number> = {};
  Object.keys(map).forEach((k) => {
    if (k.startsWith(`${y}-`)) yearMap[k] = map[k];
  });

  return {
    year: y,
    cells,
    weeks,
    months,
    dows: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
    current: currentStreak(map),
    longest: longestStreak(yearMap),
    activeDays: Object.keys(yearMap).filter((k) => yearMap[k] > 0).length,
  };
}
