import { createMcpHandler } from "mcp-handler";
import { registerFootnoteTools } from "@/feature/footnote/mcp/tools";

/**
 * Real MCP Streamable HTTP endpoint for ChatGPT connectors.
 * URL to use in ChatGPT: https://english-strandlab.vercel.app/api/mcp
 *
 * The public tools are the Footnote journal tools defined in NEW_IDEAS_mcp.md.
 */
const handler = createMcpHandler(
  (server) => {
    registerFootnoteTools(server);
  },
  {
    serverInfo: {
      name: "english-strandlab",
      version: "1.0.0",
    },
  },
);

export { handler as GET, handler as POST, handler as DELETE };
// MCP uses the Web/Node request runtime and must remain a live endpoint on
// Vercel. Keep this route dynamic so the connector always reaches the handler.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
