"use client";

import { useEffect, useState } from "react";
import "@/feature/lab/lab.css";
import { useStrandLab } from "@/feature/lab/hooks/useStrandLab";
import { useMcpApp } from "@/feature/lab/hooks/useMcpApp";
import { DashboardPanel } from "@/feature/lab/components/dashboard/DashboardPanel";
import { ReviewPanel } from "@/feature/lab/components/review-panel";
import { LessonPanel } from "@/feature/lab/components/lesson-panel";
import type { LessonBundle } from "@/feature/lab/types";

type Screen = "dashboard" | "review" | "lesson";

/* ─── Icons ──────────────────────────────────────── */

function CatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      {/* cat face */}
      <ellipse cx="12" cy="13" rx="8" ry="7" fill="currentColor" />
      <polygon points="5,8 7,2 9,8" fill="currentColor" />
      <polygon points="15,8 17,2 19,8" fill="currentColor" />
      <circle cx="9.5" cy="13" r="1.2" fill="#fff" />
      <circle cx="14.5" cy="13" r="1.2" fill="#fff" />
      <ellipse cx="12" cy="15.5" rx="1.2" ry="0.8" fill="#fff" />
    </svg>
  );
}

/* ─── App header ─────────────────────────────────── */

function AppHeader({
  screen,
  busy,
  sheetUrl,
  configured,
  syncMsg,
  onGoRoadmap,
  onGoReview,
  onSync,
  onExport,
  onImport,
  onSetup,
}: {
  screen: Screen;
  busy: boolean;
  sheetUrl: string;
  configured: boolean;
  syncMsg: string;
  onGoRoadmap: () => void;
  onGoReview: () => void;
  onSync: () => void;
  onExport: () => void;
  onImport: (f: File) => void;
  onSetup: () => void;
}) {
  const isSyncing = syncMsg.toLowerCase().includes("sync") && busy;

  return (
    <header className="sl-app-header">
      {/* Brand */}
      <button type="button" className="sl-header-brand" onClick={onGoRoadmap}>
        <div className="sl-header-brand-mark">
          <CatIcon />
        </div>
        English StrandLab
      </button>

      {/* Nav */}
      <nav className="sl-header-nav">
        <button
          type="button"
          className={`sl-header-nav-link${screen === "dashboard" || screen === "lesson" ? " active" : ""}`}
          onClick={onGoRoadmap}
        >
          Roadmap
        </button>
        <button
          type="button"
          className={`sl-header-nav-link${screen === "review" ? " active" : ""}`}
          onClick={onGoReview}
        >
          Review
        </button>
      </nav>

      {/* Actions */}
      <div className="sl-header-actions">
        {sheetUrl ? (
          <a
            className="sl-header-chip"
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open Sheet
          </a>
        ) : (
          <span className="sl-header-chip muted">Open Sheet</span>
        )}

        <button
          type="button"
          className="sl-header-chip"
          disabled={busy}
          onClick={onSync}
          title={syncMsg}
        >
          Sync
          {isSyncing && <span className="sl-sync-dot" />}
        </button>

        <button
          type="button"
          className="sl-header-chip"
          onClick={onExport}
        >
          Export
        </button>

        <label className="sl-header-chip" style={{ cursor: "pointer" }}>
          Import
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
        </label>

        {!configured && (
          <button
            type="button"
            className="sl-header-chip"
            disabled={busy}
            onClick={onSetup}
            title="Create 4 tabs: Input/Vocabulary/Output/Fluency"
          >
            Setup
          </button>
        )}
      </div>
    </header>
  );
}

/* ─── Lab View ───────────────────────────────────── */

export function LabView() {
  const lab = useStrandLab();
  const mcp = useMcpApp();
  const [screen, setScreen] = useState<Screen>("dashboard");

  // When ChatGPT tools mutate Sheets, refresh the embedded widget
  useEffect(() => {
    if (!mcp.toolResult) return;
    void lab.refreshSync();
    const nextScreen = mcp.toolResult.screen;
    if (nextScreen === "review" || nextScreen === "dashboard") {
      setScreen(nextScreen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to toolResult
  }, [mcp.toolResult]);

  const handleLessonChange = (next: LessonBundle) => {
    void lab.updateLesson(next, { sync: false });
  };

  const openLessonScreen = (id: string) => {
    lab.openLesson(id);
    setScreen("lesson");
  };

  const openCheckpoint = async (id: string) => {
    await lab.openCheckpoint(id);
    setScreen("lesson");
  };

  const goRoadmap = () => {
    lab.closeLesson();
    setScreen("dashboard");
  };

  const goReview = () => {
    setScreen("review");
  };

  return (
    <div className="sl-root">
      {/* Sticky header */}
      <AppHeader
        screen={screen}
        busy={lab.busy}
        sheetUrl={lab.sheetUrl}
        configured={lab.configured}
        syncMsg={lab.syncMsg}
        onGoRoadmap={goRoadmap}
        onGoReview={goReview}
        onSync={() => void lab.refreshSync()}
        onExport={lab.doExport}
        onImport={(f) => void lab.doImport(f)}
        onSetup={() => void lab.runSetup()}
      />

      {/* Page content */}
      <div className="sl-page">
        {/* Lesson detail */}
        {screen === "lesson" && lab.activeLesson ? (
          <LessonPanel
            bundle={lab.activeLesson}
            busy={lab.busy}
            onBack={goRoadmap}
            onChange={handleLessonChange}
            onSave={() =>
              void lab.updateLesson(lab.activeLesson!, { sync: true })
            }
            onComplete={() =>
              void lab.completeLesson(lab.activeLesson!.input.lesson_id)
            }
          />
        ) : null}

        {/* Review queue */}
        {screen === "review" ? (
          <ReviewPanel
            lessons={lab.lessons}
            onBack={goRoadmap}
            onOpen={openLessonScreen}
          />
        ) : null}

        {/* Dashboard */}
        {screen === "dashboard" ? (
          <DashboardPanel
            lessons={lab.lessons}
            syncMsg={lab.syncMsg}
            busy={lab.busy}
            sheetUrl={lab.sheetUrl}
            configured={lab.configured}
            onOpenCheckpoint={(id) => void openCheckpoint(id)}
            onReview={goReview}
            onSync={() => void lab.refreshSync()}
            onSetup={() => void lab.runSetup()}
            onExport={lab.doExport}
            onImport={(f) => void lab.doImport(f)}
          />
        ) : null}
      </div>
    </div>
  );
}
