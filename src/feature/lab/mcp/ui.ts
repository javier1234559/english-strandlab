import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getBaseUrl } from "@/lib/baseUrl";

/**
 * Bump when widget HTML breaks ChatGPT's cached resource.
 * NOTE: ChatGPT sandbox CSP has `base-uri 'self'` — never inject <base href="https://…">.
 * Use iframe shell (or absolute asset URLs) instead.
 */
const UI_VERSION = "2026-10-18-05";
export const RESOURCE_URI = `ui://widget/strandlab.html?v=${UI_VERSION}`;

/** Legacy ChatGPT Apps SDK MIME + URI suffix. */
const SKYBRIDGE_MIME = "text/html+skybridge";
const SKYBRIDGE_URI = `${RESOURCE_URI}+skybridge`;

export function getUiMeta() {
  const baseURL = getBaseUrl();
  return {
    ui: {
      resourceUri: RESOURCE_URI,
      prefersBorder: true,
      csp: {
        // App origin: scripts/assets + nested iframe
        connectDomains: [baseURL],
        resourceDomains: [baseURL],
        frameDomains: [baseURL],
      },
    },
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

/**
 * Lightweight shell that embeds the live Next.js app.
 * Avoids serverless self-fetch of `/` (slow / can terminate ChatGPT sessions).
 */
function buildWidgetHtml(): string {
  const baseURL = getBaseUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>English StrandLab</title>
  <style>
    html, body { margin: 0; height: 100%; background: #fff; }
    iframe {
      border: 0;
      width: 100%;
      height: 100%;
      min-height: 720px;
      display: block;
    }
  </style>
</head>
<body>
  <iframe
    id="strandlab"
    src="${baseURL}/"
    title="English StrandLab"
    allow="clipboard-write; fullscreen"
    referrerpolicy="no-referrer-when-downgrade"
  ></iframe>
  <script type="module">
    // Minimal MCP Apps bridge so the host keeps the widget session alive.
    let rpcId = 0;
    const pending = new Map();

    const rpcNotify = (method, params) => {
      window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
    };

    const rpcRequest = (method, params) =>
      new Promise((resolve, reject) => {
        const id = ++rpcId;
        pending.set(id, { resolve, reject });
        window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
      });

    window.addEventListener("message", (event) => {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;
      if (typeof message.id === "number" && pending.has(message.id)) {
        const p = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) p.reject(message.error);
        else p.resolve(message.result);
      }
    });

    try {
      await rpcRequest("ui/initialize", {
        appInfo: { name: "english-strandlab", version: "1.0.0" },
        appCapabilities: {},
        protocolVersion: "2026-01-26",
      });
      rpcNotify("ui/notifications/initialized", {});
    } catch (err) {
      console.warn("[strandlab-widget] ui/initialize failed", err);
    }
  </script>
</body>
</html>`;
}

function widgetContents(uri: string, mimeType: string) {
  const html = buildWidgetHtml();
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
 * Register ChatGPT / MCP Apps UI resource + open_lab tool.
 * Shell iframe embeds the live app (same idea as opening the site in-chat).
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
    async () => widgetContents(RESOURCE_URI, RESOURCE_MIME_TYPE),
  );

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
      // Keep this tool fast — no Sheets round-trip (avoids ChatGPT session timeout).
      return withUi({
        content: [
          {
            type: "text" as const,
            text:
              `Opened English StrandLab` +
              (screen ? ` (${screen})` : "") +
              `. The interactive app should appear in the chat panel.`,
          },
        ],
        structuredContent: {
          screen: screen ?? "dashboard",
          app_url: getBaseUrl(),
        },
      });
    },
  );
}
