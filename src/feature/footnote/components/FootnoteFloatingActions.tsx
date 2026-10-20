"use client";

import { RefreshCw, Table2 } from "lucide-react";
import { useFootnoteSync } from "@/feature/footnote/hooks/useFootnote";

const sheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || "";

export function FootnoteFloatingActions() {
  const sync = useFootnoteSync();
  const isBusy = sync.isPending;

  return (
    <>
      <div className="fixed bottom-10 right-9 z-20 flex flex-col gap-3 max-sm:bottom-5 max-sm:right-5">
        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open Google Sheet"
            title="Open Google Sheet"
            className="grid size-[60px] place-items-center rounded-full bg-[#6f7a65] text-white shadow-lg transition hover:bg-[#5e6855] max-sm:size-[52px]"
          >
            <Table2 size={22} />
          </a>
        )}
        <button
          type="button"
          onClick={() => sync.mutate()}
          disabled={isBusy}
          aria-label="Sync journal"
          title={sync.isSuccess ? "Synced successfully" : "Sync journal"}
          className="grid size-[60px] place-items-center rounded-full border-0 bg-[#909a84] text-white shadow-lg transition hover:bg-[#7e8972] disabled:cursor-wait disabled:opacity-70 max-sm:size-[52px]"
        >
          <RefreshCw size={22} className={isBusy ? "animate-spin" : ""} />
        </button>
      </div>
      {sync.isError && (
        <p role="alert" className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#4d332d] px-4 py-2 font-mono text-xs text-white shadow-lg">
          {sync.error.message}
        </p>
      )}
      {sync.isSuccess && (
        <p role="status" className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#53624e] px-4 py-2 font-mono text-xs text-white shadow-lg">
          Synced from Google Sheets
        </p>
      )}
    </>
  );
}
