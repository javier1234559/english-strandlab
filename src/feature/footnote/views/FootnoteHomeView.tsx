"use client";

import { FootnoteHeader } from "@/feature/footnote/components/FootnoteHeader";
import { Timeline } from "@/feature/footnote/components/Timeline";
import { useFootnoteEntries } from "@/feature/footnote/hooks/useFootnote";

export function FootnoteHomeView() {
  const entries = useFootnoteEntries();

  return (
    <main className="min-h-screen bg-[#f6f8ed] text-[#25251f]">
      <FootnoteHeader />
      {entries.isLoading && <LoadingState />}
      {entries.isError && <ErrorState message={entries.error.message} onRetry={() => void entries.refetch()} />}
      {!entries.isLoading && !entries.isError && entries.data && entries.data.entries.length === 0 && <EmptyState />}
      {!entries.isLoading && !entries.isError && entries.data && entries.data.entries.length > 0 && <Timeline entries={entries.data.entries} />}
    </main>
  );
}

function LoadingState() {
  return (
    <section className="mx-auto max-w-[850px] space-y-6 px-7 py-16 max-sm:px-4">
      <div className="h-4 w-64 animate-pulse rounded bg-[#e4e8dc]" />
      <div className="h-32 animate-pulse rounded-xl bg-[#e4e8dc]" />
      <div className="h-32 animate-pulse rounded-xl bg-[#e4e8dc]" />
    </section>
  );
}

function EmptyState() {
  return (
    <section className="mx-auto max-w-xl px-7 py-32 text-center max-sm:px-4">
      <h1 className="font-serif text-4xl">Your journal is quiet.</h1>
      <p className="mt-4 font-mono text-sm leading-6 text-[#62675c]">Saved learning entries will appear here after you save a session through ChatGPT.</p>
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="mx-auto max-w-xl px-7 py-32 text-center max-sm:px-4">
      <h1 className="font-serif text-4xl">Could not load Footnote.</h1>
      <p className="mt-4 font-mono text-sm leading-6 text-[#62675c]">{message}</p>
      <button type="button" onClick={onRetry} className="mt-6 rounded-full bg-[#252b22] px-5 py-3 font-mono text-xs text-white">
        Try again
      </button>
    </section>
  );
}
