"use client";

import { useCallback, useEffect, useState } from "react";
import type { StrandId } from "@/feature/lab/types";

/** Suggested initial durations from Detail-lesson.md (minutes). */
export const STRAND_DEFAULT_MIN: Record<StrandId, number> = {
  input: 4,
  language: 8,
  output: 8,
  fluency: 10,
};

const PRESETS = [3, 4, 6, 8, 10, 12, 15];

export function useStrandTimer(strand: StrandId) {
  const [minutes, setMinutes] = useState(STRAND_DEFAULT_MIN[strand]);
  const totalSec = minutes * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setMinutes(STRAND_DEFAULT_MIN[strand]);
  }, [strand]);

  useEffect(() => {
    setRemaining(minutes * 60);
    setRunning(false);
  }, [minutes, strand]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(minutes * 60);
  }, [minutes]);
  const complete = useCallback(() => {
    setRunning(false);
    setRemaining(0);
  }, []);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return {
    minutes,
    setMinutes,
    presets: PRESETS,
    label: `${mm}:${ss}`,
    remaining,
    totalSec,
    running,
    expired: remaining === 0,
    start,
    pause,
    reset,
    complete,
  };
}
