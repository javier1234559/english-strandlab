import type { FootnoteDetail, InputEntry } from "@/feature/footnote/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as { error?: string; data?: T } | T | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload ? payload.error : undefined;
    throw new Error(message || `Request failed (${response.status})`);
  }
  if (payload && typeof payload === "object" && "data" in payload) return payload.data as T;
  return payload as T;
}

export const footnoteApi = {
  getEntries() {
    return request<{ entries: InputEntry[] }>("/api/footnote/entries");
  },
  getEntryDetail(entryId: string) {
    return request<FootnoteDetail>(`/api/footnote/entries/${encodeURIComponent(entryId)}`);
  },
  sync() {
    return request<{ syncedAt: string }>("/api/footnote/sync", { method: "POST" });
  },
};
