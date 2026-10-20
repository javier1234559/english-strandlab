import { NextResponse } from "next/server";
import { loadStore } from "@/feature/footnote/service/sheets";

export async function GET(_request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const { entryId } = await params;
    const store = await loadStore();
    const entry = store.inputs.find((item) => item.entry_id === entryId);
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    return NextResponse.json({ entry, vocabulary: store.vocabulary.filter((item) => item.entry_id === entryId), outputs: store.outputs.filter((item) => item.entry_id === entryId), fluency: store.fluency.filter((item) => item.entry_id === entryId), reviews: store.reviews.filter((item) => item.entry_id === entryId).sort((a, b) => b.saved_at.localeCompare(a.saved_at)).slice(0, 20) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load entry" }, { status: 502 });
  }
}
