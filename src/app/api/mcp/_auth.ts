import { type NextRequest, NextResponse } from "next/server";

// Shared token from env — same one used for Google Apps Script sync
function getToken(): string {
  return process.env.NEXT_PUBLIC_SYNC_TOKEN ?? "";
}

export function checkAuth(req: NextRequest): boolean {
  const token = getToken();
  if (!token) return false; // not configured → deny all

  // Accept either Bearer header or ?token= query param
  const authHeader = req.headers.get("authorization") ?? "";
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (bearerToken && bearerToken === token) return true;

  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token") ?? "";
  return queryToken === token;
}

export function unauthorized() {
  return NextResponse.json(
    { ok: false, error: "Unauthorized — provide Authorization: Bearer <SYNC_TOKEN>" },
    { status: 401, headers: corsHeaders() },
  );
}

export function notFound(msg = "Lesson not found") {
  return NextResponse.json({ ok: false, error: msg }, { status: 404, headers: corsHeaders() });
}

export function badRequest(msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status: 400, headers: corsHeaders() });
}

export function ok(data: Record<string, unknown>) {
  return NextResponse.json({ ok: true, ...data }, { headers: corsHeaders() });
}

export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

/** Handle OPTIONS preflight — add to every route file */
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
