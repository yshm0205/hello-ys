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
  ctaId?: string | null;
  ctaLabel?: string | null;
  ctaSection?: string | null;
  lastVisibleSection?: string | null;
  maxScrollPercent?: number;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  marketingToken?: string;
};

type ExistingMarketingSessionRow = {
  id: string;
  pageviews?: number | null;
  pricing_views?: number | null;
  cta_clicks?: number | null;
  duration_seconds?: number | null;
  max_scroll_percent?: number | null;
  last_visible_section?: string | null;
  last_clicked_cta_id?: string | null;
  last_clicked_cta_label?: string | null;
  last_clicked_cta_section?: string | null;
};

const SESSION_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_THROTTLE_WINDOWS_MS: Record<MarketingEventType, number> = {
  page_view: 5000,
  heartbeat: 20000,
  cta_click: 2000,
};
const recentEventCache = new Map<string, number>();
const BASE_SESSION_SELECT =
  "id, pageviews, pricing_views, cta_clicks, duration_seconds, first_path";
const BEHAVIOR_SESSION_SELECT = `${BASE_SESSION_SELECT}, max_scroll_percent, last_visible_section, last_clicked_cta_id, last_clicked_cta_label, last_clicked_cta_section`;

function clampDuration(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(Math.floor(value), 60 * 60 * 6));
}

function clampScrollPercent(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
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

function isMissingBehaviorFieldError(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String(error.message)
      : String(error || "");

  return (
    message.includes("max_scroll_percent") ||
    message.includes("last_visible_section") ||
    message.includes("last_clicked_cta_id") ||
    message.includes("last_clicked_cta_label") ||
    message.includes("last_clicked_cta_section")
  );
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
    let supportsBehaviorFields = true;

    let { data: existing, error: fetchError } = (await supabase
      .from("marketing_sessions")
      .select(BEHAVIOR_SESSION_SELECT)
      .eq("session_key", sessionKey)
      .maybeSingle()) as {
      data: ExistingMarketingSessionRow | null;
      error: unknown;
    };

    if (fetchError && isMissingBehaviorFieldError(fetchError)) {
      supportsBehaviorFields = false;
      const fallbackResponse = (await supabase
        .from("marketing_sessions")
        .select(BASE_SESSION_SELECT)
        .eq("session_key", sessionKey)
        .maybeSingle()) as {
        data: ExistingMarketingSessionRow | null;
        error: unknown;
      };

      existing = fallbackResponse.data;
      fetchError = fallbackResponse.error;
    }

    if (fetchError) {
      throw fetchError;
    }

    const now = new Date().toISOString();
    const durationSeconds = clampDuration(body.durationSeconds);
    const maxScrollPercent = clampScrollPercent(body.maxScrollPercent);
    const pricingBump = pagePath.includes("/pricing") ? 1 : 0;
    const lastVisibleSection = normalizeNullable(body.lastVisibleSection, 120);
    const lastClickedCtaId = normalizeNullable(body.ctaId, 120);
    const lastClickedCtaLabel = normalizeNullable(body.ctaLabel, 160);
    const lastClickedCtaSection = normalizeNullable(body.ctaSection, 120);

    if (!existing) {
      const insertPayload: Record<string, unknown> = {
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

      if (supportsBehaviorFields) {
        insertPayload.max_scroll_percent = maxScrollPercent;
        insertPayload.last_visible_section = lastVisibleSection;
        insertPayload.last_clicked_cta_id =
          eventType === "cta_click" ? lastClickedCtaId : null;
        insertPayload.last_clicked_cta_label =
          eventType === "cta_click" ? lastClickedCtaLabel : null;
        insertPayload.last_clicked_cta_section =
          eventType === "cta_click" ? lastClickedCtaSection : null;
      }

      const { error: insertError } = await supabase
        .from("marketing_sessions")
        .insert(insertPayload);

      if (insertError) {
        throw insertError;
      }

      return NextResponse.json({ success: true });
    }

    const nextValues: Record<string, unknown> = {
      last_path: normalizePath(ctaTarget || pagePath),
      last_seen_at: now,
      updated_at: now,
      pageviews:
        eventType === "page_view"
          ? Number(existing.pageviews || 0) + 1
          : Number(existing.pageviews || 0),
      pricing_views:
        eventType === "page_view"
          ? Number(existing.pricing_views || 0) + pricingBump
          : Number(existing.pricing_views || 0),
      cta_clicks:
        eventType === "cta_click"
          ? Number(existing.cta_clicks || 0) + 1
          : Number(existing.cta_clicks || 0),
      duration_seconds: Math.max(Number(existing.duration_seconds || 0), durationSeconds),
    };

    if (supportsBehaviorFields) {
      nextValues.max_scroll_percent = Math.max(
        Number(existing.max_scroll_percent || 0),
        maxScrollPercent,
      );
      nextValues.last_visible_section = lastVisibleSection || existing.last_visible_section || null;
      nextValues.last_clicked_cta_id =
        eventType === "cta_click"
          ? lastClickedCtaId
          : existing.last_clicked_cta_id || null;
      nextValues.last_clicked_cta_label =
        eventType === "cta_click"
          ? lastClickedCtaLabel
          : existing.last_clicked_cta_label || null;
      nextValues.last_clicked_cta_section =
        eventType === "cta_click"
          ? lastClickedCtaSection
          : existing.last_clicked_cta_section || null;
    }

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
