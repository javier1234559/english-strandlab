export function SectionPills({ sections }: { sections: string[] }) {
  if (!sections.length) return null;
  return <div className="flex flex-wrap gap-2">{sections.map((section) => <span key={section} className="rounded-full bg-[#ecefe4] px-3 py-1.5 font-mono text-xs text-[#32352e]">{section}</span>)}</div>;
}
