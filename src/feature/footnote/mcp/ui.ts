import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getBaseUrl } from "@/lib/baseUrl";

const UI_VERSION = "2026-10-20-footnote-01";
export const RESOURCE_URI = `ui://widget/footnote.html?v=${UI_VERSION}`;
const SKYBRIDGE_MIME = "text/html+skybridge";
const SKYBRIDGE_URI = `${RESOURCE_URI}+skybridge`;

export function getFootnoteUiMeta() {
  const baseURL = getBaseUrl();
  const ui = { resourceUri: RESOURCE_URI, prefersBorder: true, csp: { connectDomains: [baseURL], resourceDomains: [baseURL], frameDomains: [baseURL] } };
  return { ui, "ui/resourceUri": RESOURCE_URI, "openai/outputTemplate": RESOURCE_URI, "openai/widgetAccessible": true, "openai/toolInvocation/invoking": "Opening StrandLab Footnote…", "openai/toolInvocation/invoked": "StrandLab Footnote ready" };
}

export function withFootnoteUi<T extends Record<string, unknown>>(payload: T) {
  return { ...payload, _meta: getFootnoteUiMeta() };
}

function widgetHtml() {
  const baseURL = getBaseUrl();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>StrandLab Footnote</title><style>html,body{margin:0;height:100%;background:#f6f8ed}iframe{border:0;width:100%;height:100%;min-height:720px;display:block}</style></head><body><iframe src="${baseURL}/" title="StrandLab Footnote" allow="clipboard-write; fullscreen" referrerpolicy="no-referrer-when-downgrade"></iframe></body></html>`;
}

function resource(uri: string, mimeType: string) {
  return { contents: [{ uri, mimeType, text: widgetHtml(), _meta: getFootnoteUiMeta() }] };
}

export function registerFootnoteUi(server: McpServer) {
  const meta = getFootnoteUiMeta();
  registerAppResource(server, "footnote-widget", RESOURCE_URI, { description: "StrandLab Footnote journal UI", mimeType: RESOURCE_MIME_TYPE, _meta: meta }, async () => resource(RESOURCE_URI, RESOURCE_MIME_TYPE));
  server.registerResource("footnote-widget-skybridge", SKYBRIDGE_URI, { description: "StrandLab Footnote UI", mimeType: SKYBRIDGE_MIME, _meta: { ...meta, "openai/outputTemplate": SKYBRIDGE_URI } }, async () => resource(SKYBRIDGE_URI, SKYBRIDGE_MIME));
  registerAppTool(server, "open_footnote", { title: "Open StrandLab Footnote", description: "Open the StrandLab Footnote learning journal UI.", inputSchema: z.object({ screen: z.enum(["home", "detail"]).optional() }), annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }, _meta: meta }, async ({ screen }) => withFootnoteUi({ content: [{ type: "text" as const, text: `Opened StrandLab Footnote${screen ? ` (${screen})` : ""}.` }], structuredContent: { screen: screen ?? "home", app_url: getBaseUrl() } }));
}
