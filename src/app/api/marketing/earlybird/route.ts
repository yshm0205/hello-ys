import { NextResponse } from "next/server";

import {
  EARLYBIRD_FALLBACK_SUMMARY,
  getEarlybirdSummary,
} from "@/lib/marketing/earlybird";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getEarlybirdSummary();
    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[Earlybird API] Failed to load summary:", error);
    return NextResponse.json(EARLYBIRD_FALLBACK_SUMMARY, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Earlybird-Fallback": "1",
      },
    });
  }
}
