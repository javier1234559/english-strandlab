import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getBaseUrl } from "@/lib/baseUrl";
import { pullStore } from "@/feature/lab/lib/sheets";

/** Bump when widget HTML/JS breaks ChatGPT's cached resource. */
const UI_VERSION = "2026-10-18-02";
export const RESOURCE_URI = `ui://widget/strandlab.html?v=${UI_VERSION}`;

export function getUiMeta() {
  const baseURL = getBaseUrl();
  return {
    ui: {
      resourceUri: RESOURCE_URI,
      csp: {
        connectDomains: [baseURL],
        resourceDomains: [baseURL],
      },
    },
    "openai/outputTemplate": RESOURCE_URI,
    "openai/widgetAccessible": true,
    "openai/toolInvocation/invoking": "Opening English StrandLab…",
    "openai/toolInvocation/invoked": "English StrandLab ready",
  };
}

/** Attach UI meta so ChatGPT opens / refreshes the iframe widget. */
export function withUi<T extends Record<string, unknown>>(payload: T) {
  return {
    ...payload,
    _meta: getUiMeta(),
  };
}

async function fetchWidgetHtml(): Promise<string> {
  const baseURL = getBaseUrl();
  const res = await fetch(`${baseURL}/`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch widget HTML from ${baseURL}/ (${res.status})`);
  }
  let html = await res.text();

  // Absolute base so /_next assets resolve inside ChatGPT's sandboxed iframe
  if (!/<base\s/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseURL}/" />`);
  }
  return html;
}

/**
 * Register the ChatGPT / MCP Apps UI resource + open_lab tool.
 * Pattern matches `_parked/mcp-demo` that successfully embeds the app.
 */
export function registerStrandLabUi(server: McpServer) {
  const uiMeta = getUiMeta();

  registerAppResource(
    server,
    "strandlab-widget",
    RESOURCE_URI,
    {
      description: "English StrandLab learning UI (roadmap, lesson detail, review)",
      mimeType: RESOURCE_MIME_TYPE,
      _meta: uiMeta,
    },
    async () => {
      const html = await fetchWidgetHtml();
      return {
        contents: [
          {
            uri: RESOURCE_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: uiMeta,
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "open_lab",
    {
      title: "Open English StrandLab",
      description:
        "Open the English StrandLab app UI inside ChatGPT. Call this when the user asks to open the app, show the roadmap, or view the learning interface. Prefer this tool whenever the user wants to see the app, not only when reading data.",
      inputSchema: z.object({
        screen: z
          .enum(["dashboard", "review"])
          .optional()
          .describe("Optional starting screen hint for the UI"),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: uiMeta,
    },
    async ({ screen }) => {
      const store = await pullStore();
      const due = store.lessons.filter((l) => {
        const dueAt = l.input.next_review_at;
        return dueAt && dueAt <= new Date().toISOString();
      }).length;

      return withUi({
        content: [
          {
            type: "text" as const,
            text:
              `Opened English StrandLab` +
              (screen ? ` (${screen})` : "") +
              `. ${store.lessons.length} lesson(s) on the roadmap` +
              (due ? `, ${due} due for review` : "") +
              `. Use the widget to navigate; Sync in the app after tool saves.`,
          },
        ],
        structuredContent: {
          screen: screen ?? "dashboard",
          lesson_count: store.lessons.length,
          due_for_review: due,
        },
      });
    },
  );
}
