import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

function normalizeMarkdown(content: string) {
  // Some rows created through an external MCP client contain the two
  // characters "\\n" instead of a real line break. Normalize at render time
  // so existing Sheet data displays correctly without rewriting the source.
  return content.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n");
}

export function MarkdownContent({ content, compact = false }: { content: string; compact?: boolean }) {
  return (
    <div className={`prose prose-stone max-w-none font-mono text-[#383c34] prose-headings:font-serif prose-headings:font-medium prose-headings:text-[#25251f] prose-a:text-[#596b55] prose-a:underline prose-blockquote:border-l-[#8f9884] prose-blockquote:text-[#4f554b] prose-code:rounded prose-code:bg-[#e4e8dc] prose-code:px-1 prose-code:py-0.5 prose-code:text-[#34382f] prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-[#20241d] prose-pre:text-[#eef1e7] prose-img:rounded-lg prose-li:my-1 ${compact ? "prose-sm leading-6" : "prose-base leading-7"}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{normalizeMarkdown(content || "")}</ReactMarkdown>
    </div>
  );
}
