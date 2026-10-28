import { NextRequest, NextResponse } from "next/server";
import { attributionInput, pagePurpose } from "@/lib/marketing/attribution-model";
import { recordAttribution } from "@/lib/marketing/attribution-record";
import { MARKETING_SESSION_COOKIE, MARKETING_TOKEN_COOKIE } from "@/lib/marketing/tracking";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });
  if (Number(request.headers.get("content-length")) > 8000) return new NextResponse(null, { status: 413 });
  const raw = await request.text();
  if (raw.length > 8000) return new NextResponse(null, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(raw); }
  catch (error) {
    if (error instanceof SyntaxError) return new NextResponse(null, { status: 400 });
    throw error;
  }
  const parsed = attributionInput.safeParse(body);
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const input = parsed.data;
  const purpose = pagePurpose(input.path);
  if (!purpose) return new NextResponse(null, { status: 400 });
  if (request.cookies.get(MARKETING_TOKEN_COOKIE)?.value !== input.token ||
      request.cookies.get(MARKETING_SESSION_COOKIE)?.value !== input.visitorId) {
    return new NextResponse(null, { status: 403 });
  }
  try {
    await recordAttribution(input, purpose);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Attribution] persistence failed", error instanceof Error ? error.name : "database_error");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
