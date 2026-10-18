import type { StrandLabStore } from "@/feature/lab/types";
import { emptyStore } from "@/feature/lab/lib/lesson";
import { labConfig } from "@/feature/lab/lib/config";

export function loadStore(): StrandLabStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(labConfig.storageKey);
    if (!raw) return emptyStore();
    const data = JSON.parse(raw) as StrandLabStore;
    if (!data || !Array.isArray(data.lessons)) return emptyStore();
    return {
      version: 1,
      updatedAt: Number(data.updatedAt) || 0,
      lessons: data.lessons,
    };
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: StrandLabStore): StrandLabStore {
  const next: StrandLabStore = {
    version: 1,
    updatedAt: Date.now(),
    lessons: Array.isArray(store.lessons) ? store.lessons : [],
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(labConfig.storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  return next;
}
