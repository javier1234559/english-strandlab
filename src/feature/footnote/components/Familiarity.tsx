import type { FamiliarityLevel } from "@/feature/footnote/types";

const labels: Record<FamiliarityLevel, string> = { 1: "Mới", 2: "Làm quen", 3: "Ghi nhớ", 4: "Làm chủ" };

export function Familiarity({ level }: { level: FamiliarityLevel | null }) {
  return (
    <div className="flex min-w-[144px] items-center justify-between gap-3" aria-label={level ? `Familiarity: ${labels[level]}` : "Familiarity not assessed"}>
      <span className="flex gap-0.5" aria-hidden>{[1, 2, 3, 4, 5].map((dot) => <i key={dot} className={`size-2.5 rounded-full ${level && dot <= level ? "bg-[#8f9884]" : "bg-[#dfe2d8]"}`} />)}</span>
      <small className="whitespace-nowrap font-mono text-xs text-[#5b6055]">{level ? labels[level] : "Chưa đánh giá"}</small>
    </div>
  );
}
