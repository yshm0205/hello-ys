import { NextResponse } from "next/server";

import {
  getMarketingReviews,
  MARKETING_REVIEWS_FALLBACK,
} from "@/lib/marketing/reviews";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const summary = await getMarketingReviews();
    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[Marketing Reviews API] Failed to load reviews:", error);
    return NextResponse.json(MARKETING_REVIEWS_FALLBACK, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Marketing-Reviews-Fallback": "1",
      },
    });
  }
}
