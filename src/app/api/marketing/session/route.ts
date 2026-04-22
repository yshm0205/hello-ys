import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/utils/supabase/admin";

type MarketingEventType = "page_view" | "heartbeat" | "cta_click";

type MarketingPayload = {
  eventType?: MarketingEventType;
  sessionKey?: string;
  pagePath?: string;
  referrer?: string | null;
  locale?: string | null;
  durationSeconds?: number;
  ctaTarget?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
};

function clampDuration(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(Math.floor(value), 60 * 60 * 6));
}

function detectDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}

function normalizePath(input: string | undefined) {
  if (!input) return "/";
  if (!input.startsWith("/")) return "/";
  return input.slice(0, 200);
}

function normalizeNullable(input: string | null | undefined, max = 255) {
  if (!input) return null;
  return input.slice(0, max);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as MarketingPayload;
    const eventType = body.eventType;
    const sessionKey = body.sessionKey?.trim();
    const pagePath = normalizePath(body.pagePath);

    if (!sessionKey || !eventType) {
      return NextResponse.json(
        { success: false, error: "sessionKey and eventType are required" },
        { status: 400 },
      );
    }

    if (!["page_view", "heartbeat", "cta_click"].includes(eventType)) {
      return NextResponse.json(
        { success: false, error: "invalid eventType" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from("marketing_sessions")
      .select("id, pageviews, pricing_views, cta_clicks, duration_seconds, first_path")
      .eq("session_key", sessionKey)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    const now = new Date().toISOString();
    const durationSeconds = clampDuration(body.durationSeconds);
    const pricingBump = pagePath.includes("/pricing") ? 1 : 0;

    if (!existing) {
      const insertPayload = {
        session_key: sessionKey,
        first_path: pagePath,
        last_path: pagePath,
        referrer: normalizeNullable(body.referrer, 500),
        locale: normalizeNullable(body.locale, 16),
        device_type: detectDeviceType(request.headers.get("user-agent") || ""),
        utm_source: normalizeNullable(body.utmSource, 120),
        utm_medium: normalizeNullable(body.utmMedium, 120),
        utm_campaign: normalizeNullable(body.utmCampaign, 120),
        utm_content: normalizeNullable(body.utmContent, 120),
        utm_term: normalizeNullable(body.utmTerm, 120),
        pageviews: 1,
        pricing_views: eventType === "page_view" ? pricingBump : 0,
        cta_clicks: eventType === "cta_click" ? 1 : 0,
        duration_seconds: durationSeconds,
        first_seen_at: now,
        last_seen_at: now,
        created_at: now,
        updated_at: now,
      };

      const { error: insertError } = await supabase
        .from("marketing_sessions")
        .insert(insertPayload);

      if (insertError) {
        throw insertError;
      }

      return NextResponse.json({ success: true });
    }

    const nextValues = {
      last_path: normalizePath(body.ctaTarget || pagePath),
      last_seen_at: now,
      updated_at: now,
      pageviews:
        eventType === "page_view" ? (existing.pageviews || 0) + 1 : existing.pageviews || 0,
      pricing_views:
        eventType === "page_view"
          ? (existing.pricing_views || 0) + pricingBump
          : existing.pricing_views || 0,
      cta_clicks:
        eventType === "cta_click" ? (existing.cta_clicks || 0) + 1 : existing.cta_clicks || 0,
      duration_seconds: Math.max(existing.duration_seconds || 0, durationSeconds),
    };

    const { error: updateError } = await supabase
      .from("marketing_sessions")
      .update(nextValues)
      .eq("id", existing.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Marketing Session] Error:", error);
    return NextResponse.json(
      { success: false, error: "failed to track marketing session" },
      { status: 500 },
    );
  }
}
