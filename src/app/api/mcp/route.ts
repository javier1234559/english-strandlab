import { createMcpHandler } from "mcp-handler";
import { registerStrandLabTools } from "@/feature/lab/mcp/tools";

/**
 * Real MCP Streamable HTTP endpoint for ChatGPT connectors.
 * URL to use in ChatGPT: https://english-strandlab.vercel.app/api/mcp
 *
 * REST helpers remain under /api/mcp/lessons, /api/mcp/stats, etc.
 */
const handler = createMcpHandler(
  (server) => {
    registerStrandLabTools(server);
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
