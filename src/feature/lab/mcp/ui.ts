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
const UI_VERSION = "2026-10-18-03";
export const RESOURCE_URI = `ui://widget/strandlab.html?v=${UI_VERSION}`;

/** Legacy ChatGPT Apps SDK MIME + URI suffix (still accepted by many hosts). */
const SKYBRIDGE_MIME = "text/html+skybridge";
const SKYBRIDGE_URI = `${RESOURCE_URI}+skybridge`;

export function getUiMeta() {
  const baseURL = getBaseUrl();
  return {
    ui: {
      resourceUri: RESOURCE_URI,
      prefersBorder: true,
      csp: {
        connectDomains: [baseURL],
        resourceDomains: [baseURL],
      },
    },
    // MCP Apps + OpenAI aliases
    "ui/resourceUri": RESOURCE_URI,
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

function absolutizeHtml(html: string, baseURL: string): string {
  let out = html;
  if (!/<base\s/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, `<head$1><base href="${baseURL}/" />`);
  }
  // Rewrite root-relative asset URLs so they work even if <base> is stripped
  out = out.replace(
    /(href|src|srcset)=["']\/(?!\/)/g,
    `$1="${baseURL}/`,
  );
  return out;
}

async function fetchWidgetHtml(): Promise<string> {
  const baseURL = getBaseUrl();
  const res = await fetch(`${baseURL}/`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch widget HTML from ${baseURL}/ (${res.status})`);
  }
  return absolutizeHtml(await res.text(), baseURL);
}

async function widgetContents(uri: string, mimeType: string) {
  const html = await fetchWidgetHtml();
  const uiMeta = getUiMeta();
  return {
    contents: [
      {
        uri,
        mimeType,
        text: html,
        _meta: uiMeta,
      },
    ],
  };
}

/**
 * Register the ChatGPT / MCP Apps UI resource + open_lab tool.
 * Pattern matches `_parked/mcp-demo`, plus a skybridge twin for older ChatGPT hosts.
 */
export function registerStrandLabUi(server: McpServer) {
  const uiMeta = getUiMeta();

  // Modern MCP Apps resource
  registerAppResource(
    server,
    "strandlab-widget",
    RESOURCE_URI,
    {
      description: "English StrandLab learning UI (roadmap, lesson detail, review)",
      mimeType: RESOURCE_MIME_TYPE,
      _meta: uiMeta,
    },
    async () => widgetContents(RESOURCE_URI, RESOURCE_MIME_TYPE),
  );

  // Legacy OpenAI Apps SDK resource (text/html+skybridge)
  server.registerResource(
    "strandlab-widget-skybridge",
    SKYBRIDGE_URI,
    {
      description: "English StrandLab UI (ChatGPT skybridge compatibility)",
      mimeType: SKYBRIDGE_MIME,
      _meta: {
        ...uiMeta,
        "openai/outputTemplate": SKYBRIDGE_URI,
      },
    },
    async () => widgetContents(SKYBRIDGE_URI, SKYBRIDGE_MIME),
  );

  registerAppTool(
    server,
    "open_lab",
    {
      title: "Open English StrandLab",
      description:
        "ALWAYS call this tool to open/show/embed the English StrandLab visual app UI inside the chat. Use when the user asks to open the app, show the roadmap, show the lesson UI, or view StrandLab. This tool returns an interactive widget — do not say you cannot open the UI without calling this first.",
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
              `. The interactive app widget should appear above/below this message.`,
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
