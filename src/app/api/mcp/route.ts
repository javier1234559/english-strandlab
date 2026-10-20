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
export const maxDuration = 60;
