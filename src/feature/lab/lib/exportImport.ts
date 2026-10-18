import type { StrandLabStore } from "@/feature/lab/types";
import { emptyStore } from "@/feature/lab/lib/lesson";
import { saveStore } from "@/feature/lab/lib/storage";

export function exportStore(store: StrandLabStore): string {
  return JSON.stringify(store, null, 2);
}

export function importStore(text: string): StrandLabStore {
  const data = JSON.parse(text) as StrandLabStore;
  if (!data || typeof data !== "object" || !Array.isArray(data.lessons)) {
    throw new Error("File không hợp lệ — cần StrandLab export JSON.");
  }
  return saveStore({
    version: 1,
    updatedAt: Date.now(),
    lessons: data.lessons,
  });
}

export function downloadExport(store: StrandLabStore) {
  const blob = new Blob([exportStore(store)], { type: "application/json" });
  const a = document.createElement("a");
  const day = new Date().toISOString().slice(0, 10);
  a.href = URL.createObjectURL(blob);
  a.download = `english-strandlab-${day}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function emptyIfNeeded(store: StrandLabStore | null): StrandLabStore {
  return store || emptyStore();
}
