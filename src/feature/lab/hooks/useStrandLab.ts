"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LessonBundle, StrandLabStore } from "@/feature/lab/types";
import {
  emptyStore,
  markLessonCompleted,
  markLessonInProgress,
  sortLessons,
} from "@/feature/lab/lib/lesson";
import { loadStore, saveStore } from "@/feature/lab/lib/storage";
import {
  configured,
  getSheetUrl,
  pushLesson,
  setupSheets,
  syncStore,
} from "@/feature/lab/lib/sheets";
import {
  bundleFromCheckpoint,
  loadCheckpoint,
} from "@/feature/lab/lib/curriculum";
import { downloadExport, importStore } from "@/feature/lab/lib/exportImport";

export function useStrandLab() {
  // Same empty snapshot on server + first client paint; load localStorage after mount.
  const [store, setStore] = useState<StrandLabStore>(emptyStore);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState("Đang kiểm tra Sheet…");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const didSync = useRef(false);

  const lessons = useMemo(() => sortLessons(store.lessons), [store.lessons]);
  const activeLesson =
    lessons.find((l) => l.input.lesson_id === activeLessonId) || null;

  const persist = useCallback((next: StrandLabStore) => {
    const saved = saveStore(next);
    setStore(saved);
    return saved;
  }, []);

  const refreshSync = useCallback(async (current?: StrandLabStore) => {
    const base = current || loadStore();
    if (!configured()) {
      setSyncMsg(
        "Sheet: chưa cấu hình — điền .env.local (token/URL mới) rồi restart",
      );
      return base;
    }
    setBusy(true);
    setSyncMsg("Đang đồng bộ Sheet…");
    try {
      const result = await syncStore(base);
      const saved = saveStore(result.store);
      setStore(saved);
      setSyncMsg(
        `Đã sync (${result.direction}) · ${saved.lessons.length} lesson · ${new Date().toLocaleTimeString()}`,
      );
      return saved;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sync lỗi";
      console.error("[strandlab]", e);
      setSyncMsg("Sync lỗi: " + msg);
      return base;
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    setStore(loadStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || didSync.current) return;
    didSync.current = true;
    void refreshSync(loadStore());
  }, [hydrated, refreshSync]);

  const openLesson = useCallback((lessonId: string) => {
    setStore((prev) => {
      const lessonsNext = prev.lessons.map((b) =>
        b.input.lesson_id === lessonId ? markLessonInProgress(b) : b,
      );
      return saveStore({ ...prev, lessons: lessonsNext });
    });
    setActiveLessonId(lessonId);
  }, []);

  const openCheckpoint = useCallback(
    async (checkpointId: string) => {
      const existing = store.lessons.find(
        (l) => l.input.lesson_id === checkpointId,
      );
      if (existing) {
        openLesson(checkpointId);
        return;
      }
      setBusy(true);
      try {
        const cp = await loadCheckpoint(checkpointId);
        const number =
          (store.lessons.reduce(
            (m, l) => Math.max(m, l.input.lesson_number || 0),
            0,
          ) || 0) + 1;
        const bundle = markLessonInProgress(bundleFromCheckpoint(cp, number));
        persist({ ...store, lessons: [...store.lessons, bundle] });
        setActiveLessonId(bundle.input.lesson_id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Không mở được bài";
        setSyncMsg(msg);
      } finally {
        setBusy(false);
      }
    },
    [openLesson, persist, store],
  );

  const closeLesson = useCallback(() => setActiveLessonId(null), []);

  const updateLesson = useCallback(
    async (bundle: LessonBundle, opts?: { sync?: boolean }) => {
      const lessonsNext = store.lessons.map((l) =>
        l.input.lesson_id === bundle.input.lesson_id ? bundle : l,
      );
      const next = persist({ ...store, lessons: lessonsNext });
      if (opts?.sync === true && configured()) {
        setBusy(true);
        try {
          await pushLesson(bundle);
          setSyncMsg(`Đã lưu lesson · ${new Date().toLocaleTimeString()}`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Save lỗi";
          console.error("[strandlab] saveLesson", e);
          setSyncMsg("Save lỗi: " + msg);
        } finally {
          setBusy(false);
        }
      }
      return next;
    },
    [persist, store],
  );

  const completeLesson = useCallback(
    async (lessonId: string) => {
      const found = store.lessons.find((l) => l.input.lesson_id === lessonId);
      if (!found) return;
      const done = markLessonCompleted(found);
      await updateLesson(done, { sync: true });
    },
    [store.lessons, updateLesson],
  );

  const runSetup = useCallback(async () => {
    if (!configured()) {
      setSyncMsg("Chưa có token/URL trong .env.local");
      return;
    }
    setBusy(true);
    try {
      await setupSheets();
      setSyncMsg("Setup tabs OK (Input / Vocabulary / Output / Fluency)");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Setup lỗi";
      setSyncMsg("Setup lỗi: " + msg);
    } finally {
      setBusy(false);
    }
  }, []);

  const doExport = useCallback(() => {
    downloadExport(store);
    setSyncMsg("Đã export JSON");
  }, [store]);

  const doImport = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const next = importStore(text);
      setStore(next);
      setSyncMsg(`Đã import ${next.lessons.length} lesson`);
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "Import lỗi");
    }
  }, []);

  return {
    store,
    lessons,
    activeLesson,
    activeLessonId,
    syncMsg,
    busy,
    sheetUrl: getSheetUrl(),
    configured: configured(),
    openLesson,
    openCheckpoint,
    closeLesson,
    updateLesson,
    completeLesson,
    refreshSync: () => refreshSync(store),
    runSetup,
    doExport,
    doImport,
  };
}
