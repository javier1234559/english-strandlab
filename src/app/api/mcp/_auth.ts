import { type NextRequest, NextResponse } from "next/server";

/**
 * Auth is currently disabled for easy local / ChatGPT testing.
 * Re-enable by checking Authorization: Bearer <SYNC_TOKEN> or ?token=.
 */
export function checkAuth(_req: NextRequest): boolean {
  return true;
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
