import { NextRequest, NextResponse } from "next/server";

import { MARKETING_TOKEN_COOKIE } from "@/lib/marketing/tracking";
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
  marketingToken?: string;
};

const SESSION_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_THROTTLE_WINDOWS_MS: Record<MarketingEventType, number> = {
  page_view: 5000,
  heartbeat: 20000,
  cta_click: 2000,
};
const recentEventCache = new Map<string, number>();

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

function getClientAddress(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function isSameOriginRequest(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin;
  const origin = request.headers.get("origin");

  if (origin) {
    return origin === requestOrigin;
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return false;
  }

  try {
    return new URL(referer).origin === requestOrigin;
  } catch {
    return false;
  }
}

function buildThrottleKey(
  eventType: MarketingEventType,
  sessionKey: string,
  pagePath: string,
  ctaTarget: string | null,
  clientAddress: string,
) {
  return [eventType, sessionKey, clientAddress, pagePath, ctaTarget || "-"].join(":");
}

function shouldThrottleEvent(cacheKey: string, windowMs: number) {
  const now = Date.now();

  for (const [key, expiresAt] of recentEventCache) {
    if (expiresAt <= now) {
      recentEventCache.delete(key);
    }
  }

  const existingExpiry = recentEventCache.get(cacheKey);
  if (existingExpiry && existingExpiry > now) {
    return true;
  }

  recentEventCache.set(cacheKey, now + windowMs);
  return false;
}

function hasValidMarketingToken(request: NextRequest, token: string | undefined) {
  const cookieToken = request.cookies.get(MARKETING_TOKEN_COOKIE)?.value?.trim() || "";
  const requestToken = (token || "").trim();

  return !!cookieToken && !!requestToken && cookieToken === requestToken;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as MarketingPayload;
    const eventType = body.eventType;
    const sessionKey = body.sessionKey?.trim();
    const pagePath = normalizePath(body.pagePath);
    const ctaTarget = normalizeNullable(body.ctaTarget, 200);

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

    if (!SESSION_KEY_PATTERN.test(sessionKey)) {
      return NextResponse.json(
        { success: false, error: "invalid sessionKey" },
        { status: 400 },
      );
    }

    if (!isSameOriginRequest(request)) {
      return NextResponse.json(
        { success: false, error: "cross-origin marketing tracking blocked" },
        { status: 403 },
      );
    }

    if (!hasValidMarketingToken(request, body.marketingToken)) {
      return NextResponse.json(
        { success: false, error: "invalid marketing tracking token" },
        { status: 403 },
      );
    }

    const throttleKey = buildThrottleKey(
      eventType,
      sessionKey,
      pagePath,
      ctaTarget,
      getClientAddress(request),
    );

    if (shouldThrottleEvent(throttleKey, EVENT_THROTTLE_WINDOWS_MS[eventType])) {
      return NextResponse.json({ success: true, skipped: true });
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
      last_path: normalizePath(ctaTarget || pagePath),
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
