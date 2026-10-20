"use client";

import { FootnoteHeader } from "@/feature/footnote/components/FootnoteHeader";
import { EntryDetail } from "@/feature/footnote/components/EntryDetail";
import { useFootnoteEntry } from "@/feature/footnote/hooks/useFootnote";

export function FootnoteDetailView({ entryId }: { entryId: string }) {
  const detail = useFootnoteEntry(entryId);
  return <main className="min-h-screen bg-[#f6f8ed] text-[#25251f]"><FootnoteHeader />
    {detail.isLoading && <div className="mx-auto max-w-[1260px] space-y-5 px-7 py-12 max-sm:px-4"><div className="h-8 w-1/3 animate-pulse rounded bg-[#e4e8dc]" /><div className="h-40 animate-pulse rounded-xl bg-[#e4e8dc]" /></div>}
    {detail.isError && <section className="mx-auto max-w-xl px-7 py-32 text-center max-sm:px-4"><h1 className="font-serif text-4xl">Entry unavailable.</h1><p className="mt-4 font-mono text-sm text-[#62675c]">{detail.error.message}</p></section>}
    {detail.data && <EntryDetail detail={detail.data} />}
  </main>;
}
