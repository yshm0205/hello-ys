import { NextRequest, NextResponse } from "next/server";
import { keyContentDestination } from "@/lib/marketing/key-content-links";

export async function GET(request: NextRequest, context: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await context.params;
  const placement = request.nextUrl.searchParams.get("p") === "description" ? "description" : "pin";
  const path = keyContentDestination(videoId, placement);
  if (!path) return new NextResponse("Unknown video", { status: 404 });
  const response = NextResponse.redirect(new URL(path, request.url), 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
