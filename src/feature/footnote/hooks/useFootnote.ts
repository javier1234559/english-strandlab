"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { footnoteApi } from "@/feature/footnote/service/footnoteApi";

export const FOOTNOTE_KEYS = {
  all: ["footnote"] as const,
  entries: () => [...FOOTNOTE_KEYS.all, "entries"] as const,
  entry: (entryId: string) => [...FOOTNOTE_KEYS.entries(), entryId] as const,
};

export function useFootnoteEntries() {
  return useQuery({ queryKey: FOOTNOTE_KEYS.entries(), queryFn: footnoteApi.getEntries, retry: 1 });
}

export function useFootnoteEntry(entryId: string) {
  return useQuery({ queryKey: FOOTNOTE_KEYS.entry(entryId), queryFn: () => footnoteApi.getEntryDetail(entryId), enabled: Boolean(entryId), retry: 1 });
}

export function useFootnoteSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...FOOTNOTE_KEYS.all, "sync"],
    mutationFn: footnoteApi.sync,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: FOOTNOTE_KEYS.all }); },
  });
}
