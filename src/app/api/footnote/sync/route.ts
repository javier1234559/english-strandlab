import { NextResponse } from "next/server";
import { loadStore } from "@/feature/footnote/service/sheets";

export async function POST() {
  try {
    const store = await loadStore();
    return NextResponse.json({ syncedAt: new Date().toISOString(), entryCount: store.inputs.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sync failed" }, { status: 502 });
  }
}
