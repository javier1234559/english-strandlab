import { NextResponse } from "next/server";
import { loadStore } from "@/feature/footnote/service/sheets";

export async function GET() {
  try {
    const store = await loadStore();
    const entries = [...store.inputs].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((entry) => ({
      ...entry,
      strands_practiced: [
        "Input" as const,
        ...(store.vocabulary.some((item) => item.entry_id === entry.entry_id) ? ["Vocabulary" as const] : []),
        ...(store.outputs.some((item) => item.entry_id === entry.entry_id) ? ["Output" as const] : []),
        ...(store.fluency.some((item) => item.entry_id === entry.entry_id) ? ["Fluency" as const] : []),
      ],
    }));
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load Footnote entries" }, { status: 502 });
  }
}
