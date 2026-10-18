import { type NextRequest } from "next/server";
import { ok, OPTIONS } from "./_auth";

export { OPTIONS };

/** GET /api/mcp — discovery index for available MCP endpoints */
export async function GET(req: NextRequest) {
  const base = new URL(req.url).origin;

  return ok({
    name: "English StrandLab MCP",
    auth: "none",
    openapi: `${base}/api/mcp/openapi`,
    plugin_manifest: `${base}/.well-known/ai-plugin.json`,
    endpoints: [
      { method: "GET", path: "/api/mcp/stats", description: "Learning statistics" },
      { method: "GET", path: "/api/mcp/lessons", description: "List roadmap lessons (?due=true)" },
      { method: "POST", path: "/api/mcp/lessons", description: "Create a new lesson" },
      { method: "GET", path: "/api/mcp/lessons/{id}", description: "Full lesson bundle" },
      { method: "PATCH", path: "/api/mcp/lessons/{id}", description: "Update lesson metadata (Strand 1)" },
      {
        method: "PATCH",
        path: "/api/mcp/lessons/{id}/vocabulary",
        description: "Upsert vocabulary (Strand 2)",
      },
      {
        method: "DELETE",
        path: "/api/mcp/lessons/{id}/vocabulary",
        description: "Delete a vocabulary item",
      },
      {
        method: "PATCH",
        path: "/api/mcp/lessons/{id}/output",
        description: "Save writing output (Strand 3)",
      },
      {
        method: "PATCH",
        path: "/api/mcp/lessons/{id}/fluency",
        description: "Save fluency rounds (Strand 4)",
      },
      {
        method: "POST",
        path: "/api/mcp/lessons/{id}/complete",
        description: "Mark lesson completed + schedule review",
      },
    ],
  });
}
