import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, MoreHorizontal } from "lucide-react";
import type { FootnoteDetail, FootnoteSection } from "@/feature/footnote/types";
import { Familiarity } from "@/feature/footnote/components/Familiarity";
import { MarkdownContent } from "@/feature/footnote/components/MarkdownContent";
import { SectionPills } from "@/feature/footnote/components/SectionPills";

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "DATE UNKNOWN";
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()} · ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

function sections(detail: FootnoteDetail): FootnoteSection[] {
  if (detail.entry.strands_practiced?.length) return detail.entry.strands_practiced;
  const result: FootnoteSection[] = ["Input"];
  if (detail.vocabulary.length) result.push("Vocabulary");
  if (detail.outputs.length) result.push("Output");
  if (detail.fluency.length) result.push("Fluency");
  return result;
}

export function EntryDetail({ detail }: { detail: FootnoteDetail }) {
  const { entry } = detail;
  const nextReview = formatDate(entry.next_review_at);
  return (
    <article className="mx-auto max-w-[1260px] px-7 pb-20 pt-8 max-sm:px-4 max-sm:pb-16 max-sm:pt-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center font-mono text-xs text-[#5f6358] max-sm:text-[10px]"><Link href="/" aria-label="Back to home" className="text-2xl text-[#11130f] no-underline"><ArrowLeft size={21} /></Link><div>{formatCreatedAt(entry.created_at)}</div><div className="flex items-center justify-end gap-4"><MoreHorizontal size={21} /><a href={entry.chat_url || undefined} target="_blank" rel="noreferrer" aria-label={entry.chat_url ? "Open ChatGPT conversation" : "ChatGPT conversation unavailable"} className={`grid size-[34px] place-items-center rounded-full bg-[#8f9a83] text-white ${entry.chat_url ? "" : "pointer-events-none opacity-40"}`}><ArrowUpRight size={20} /></a></div></div>
      <h1 className="mt-5 font-serif text-[clamp(34px,4vw,47px)] font-medium leading-tight text-[#25251f]">{entry.title}</h1>
      {entry.description && <p className="mt-3 max-w-2xl font-mono text-sm leading-6 text-[#5c6058]">{entry.description}</p>}
      <div className="mb-5 mt-4 flex items-center justify-between gap-4 max-sm:block"><SectionPills sections={sections(detail)} />{nextReview && <span className="mt-2 flex items-center gap-2 font-mono text-xs text-[#54594e]"><CalendarDays size={16} />Next review: {nextReview}</span>}</div>
      {/* Thumbnail support is intentionally paused while content/data quality is prioritized.
          Keep this field/rendering path for a later visual pass.
      {entry.thumbnail_url && <img src={entry.thumbnail_url} alt="" className="block h-[170px] w-full rounded-lg object-cover max-sm:h-[135px]" />}
      */}
      <div className="mt-5 border-t border-[#d7dbcf] pt-5">
        {entry.content_mode === "simple" ? <MarkdownContent content={entry.content_markdown} /> : <>
          <MarkdownContent content={entry.content_markdown} />
          {detail.vocabulary.length > 0 && <section className="mt-8 border-t border-[#d7dbcf] pt-5"><h2 className="mb-4 font-serif text-[27px] font-medium">Vocabulary</h2><div className="grid gap-3">{detail.vocabulary.map((item) => <div key={item.vocab_id} className="flex items-center justify-between gap-5 max-sm:flex-col max-sm:items-start"><div className="font-mono text-[13px] leading-6 text-[#383c34]"><strong>{item.word}</strong> <em className="not-italic text-[#70766b]">({item.type})</em><MarkdownContent content={item.meaning} compact /></div><Familiarity level={item.familiarity_level} /></div>)}</div></section>}
          {detail.outputs.length > 0 && <section className="mt-8 border-t border-[#d7dbcf] pt-5"><h2 className="mb-4 font-serif text-[27px] font-medium">Output</h2><div className="grid gap-3">{detail.outputs.map((item) => <div key={item.output_id} className="rounded-lg bg-[#eef0e6] p-4"><MarkdownContent content={item.content} compact /><Familiarity level={item.familiarity_level} /></div>)}</div></section>}
          {detail.fluency.length > 0 && <section className="mt-8 border-t border-[#d7dbcf] pt-5"><h2 className="mb-4 font-serif text-[27px] font-medium">Fluency</h2><div className="grid gap-3">{detail.fluency.map((item) => <div key={item.fluency_id} className="rounded-lg bg-[#eef0e6] p-4"><MarkdownContent content={item.content} compact /><Familiarity level={item.familiarity_level} /></div>)}</div></section>}
        </>}
      </div>
    </article>
  );
}
