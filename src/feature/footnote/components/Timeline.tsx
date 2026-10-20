import Link from "next/link";
import type { InputEntry } from "@/feature/footnote/types";
import { SectionPills } from "@/feature/footnote/components/SectionPills";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", weekday: "short" }).format(date).toUpperCase();
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--:--" : new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sections(entry: InputEntry) {
  return entry.strands_practiced ?? [];
}

export function Timeline({ entries }: { entries: InputEntry[] }) {
  const today = todayKey();
  const groups = Object.entries(
    entries.reduce<Record<string, InputEntry[]>>((result, entry) => {
      (result[entry.created_at.slice(0, 10)] ??= []).push(entry);
      return result;
    }, {}),
  )
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, group]) => [
      date,
      [...group].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    ] as const);

  return (
    <section className="mx-auto max-w-[1260px] px-7 py-11 pb-20 max-sm:px-4 max-sm:pt-8" aria-label="Learning journal">
      {groups.map(([date, group]) => {
        const isToday = date === today;
        return (
          <div key={date} className={isToday ? "mb-10" : "not-last:mb-9"}>
            <div className="relative mt-0 max-w-[850px] before:absolute before:bottom-8 before:left-[72px] before:top-4 before:w-px before:bg-[#b8bdae] max-sm:before:left-[51px]">
              {group.map((entry) => (
                <article key={entry.entry_id} className="relative grid min-h-[174px] grid-cols-[51px_44px_1fr] items-start max-sm:min-h-[140px] max-sm:grid-cols-[34px_34px_1fr]">
                  <time className="pt-4 font-mono text-xs text-[#5d6058]">{formatTime(entry.created_at)}</time>
                  <div className="z-[1] mx-auto mt-5 size-1.5 rounded-full bg-[#9ba18f]" />
                  <Link href={`/entries/${encodeURIComponent(entry.entry_id)}`} className="relative block text-inherit no-underline">
                    {/* Thumbnail support is intentionally paused while content/data quality is prioritized.
                        Keep the field and rendering code available for a later visual pass.
                    {entry.thumbnail_url ? <img src={entry.thumbnail_url} alt="" className="h-32 w-[145px] rounded-[10px] object-cover max-sm:h-[94px] max-sm:w-[92px]" /> : <div className="h-32 w-[145px] rounded-[10px] bg-[#e9ede1] max-sm:h-[94px] max-sm:w-[92px]" aria-hidden />}
                    */}
                    <div className="pt-1">
                      <h2 className="font-serif text-[23px] font-medium leading-tight text-[#25251f] max-sm:text-lg">{entry.title}</h2>
                      <p className="my-3.5 max-w-[430px] font-mono text-[13px] leading-6 text-[#5c6058] max-sm:my-2 max-sm:text-[11px]">{entry.description}</p>
                      <SectionPills sections={sections(entry)} />
                    </div>
                  </Link>
                </article>
              ))}
            </div>
            {!isToday && (
              <div className="mt-6 flex max-w-[850px] items-center gap-3 font-mono text-xs tracking-wide text-[#4f5249]">
                <span className="h-px flex-1 bg-[#d5dacd]" />
                {formatDate(group[0]?.created_at || date)}
                <span className="h-px flex-1 bg-[#d5dacd]" />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
