import { FootnoteDetailView } from "@/feature/footnote/views/FootnoteDetailView";

export default async function EntryPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  return <FootnoteDetailView entryId={entryId} />;
}
