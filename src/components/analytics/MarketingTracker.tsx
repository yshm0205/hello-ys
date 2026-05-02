"use client";

import { useEffect, useRef } from "react";

import {
  MARKETING_SESSION_COOKIE,
  MARKETING_SESSION_STORAGE_KEY,
  MARKETING_TOKEN_COOKIE,
} from "@/lib/marketing/tracking";

const STORAGE_KEY = MARKETING_SESSION_STORAGE_KEY;

type MarketingTrackerProps = {
  pageType: "landing" | "pricing";
};

function getSessionKey() {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    writeSessionCookie(existing);
    return existing;
  }

  const cookieSession = readCookie(MARKETING_SESSION_COOKIE);
  if (cookieSession) {
    window.localStorage.setItem(STORAGE_KEY, cookieSession);
    writeSessionCookie(cookieSession);
    return cookieSession;
  }

  const next = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, next);
  writeSessionCookie(next);
  return next;
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  const matched = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!matched) return "";
  return decodeURIComponent(matched.slice(prefix.length));
}

function getMarketingToken() {
  const existing = readCookie(MARKETING_TOKEN_COOKIE);
  if (existing) return existing;

  const token = crypto.randomUUID();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${MARKETING_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
  return token;
}

function writeSessionCookie(sessionKey: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${MARKETING_SESSION_COOKIE}=${encodeURIComponent(sessionKey)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmContent: params.get("utm_content"),
    utmTerm: params.get("utm_term"),
  };
}

function clampScrollPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getScrollPercent() {
  const scrollRoot = document.documentElement;
  const maxScrollable = Math.max(1, scrollRoot.scrollHeight - window.innerHeight);
  const current = Math.max(window.scrollY, scrollRoot.scrollTop);

  if (maxScrollable <= 1) return 100;
  return clampScrollPercent((current / maxScrollable) * 100);
}

function getTrackableSections() {
  return Array.from(
    document.querySelectorAll<HTMLElement>("section[id], [data-marketing-section]"),
  );
}

function getSectionName(element: HTMLElement | null) {
  if (!element) return null;
  return element.dataset.marketingSection || element.id || null;
}

function getNearestSectionName(element: HTMLElement | null) {
  const section = element?.closest<HTMLElement>("section[id], [data-marketing-section]") || null;
  return getSectionName(section);
}

function getCurrentSectionName(sections: HTMLElement[]) {
  if (!sections.length) return null;

  const viewportAnchor = window.innerHeight * 0.55;
  let closestSection: HTMLElement | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue;

    if (rect.top <= viewportAnchor && rect.bottom >= viewportAnchor) {
      return getSectionName(section);
    }

    const distance = Math.min(
      Math.abs(rect.top - viewportAnchor),
      Math.abs(rect.bottom - viewportAnchor),
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestSection = section;
    }
  }

  return getSectionName(closestSection || sections[0]);
}

function isPurchaseCtaHref(href: string) {
  return (
    href.includes("/pricing") ||
    href.includes("/login") ||
    href.includes("/checkout/allinone")
  );
}

async function postEvent(payload: Record<string, unknown>, keepalive = false) {
  const body = JSON.stringify({
    ...payload,
    marketingToken: getMarketingToken(),
  });

  if (keepalive && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/marketing/session", blob);
    return;
  }

  await fetch("/api/marketing/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive,
  }).catch(() => undefined);
}

export function MarketingTracker({ pageType }: MarketingTrackerProps) {
  const lastVisibleSectionRef = useRef<string | null>(null);
  const maxScrollPercentRef = useRef(0);

  useEffect(() => {
    const sessionKey = getSessionKey();
    const startedAt = Date.now();
    const locale = window.location.pathname.split("/").filter(Boolean)[0] || "ko";
    const pagePath = window.location.pathname;
    const utm = getUtmParams();

    const sections = getTrackableSections();
    maxScrollPercentRef.current = getScrollPercent();
    lastVisibleSectionRef.current =
      getCurrentSectionName(sections) || getSectionName(sections[0] || null);

    void postEvent({
      eventType: "page_view",
      sessionKey,
      pagePath,
      referrer: document.referrer || null,
      locale,
      lastVisibleSection: lastVisibleSectionRef.current,
      maxScrollPercent: maxScrollPercentRef.current,
      ...utm,
    });

    let lastDurationSent = 0;
    let scrollFrameRequested = false;

    const flushDuration = (keepalive = false) => {
      const durationSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      if (durationSeconds <= lastDurationSent && !keepalive) return;
      lastDurationSent = Math.max(lastDurationSent, durationSeconds);

      void postEvent(
        {
          eventType: "heartbeat",
          sessionKey,
          pagePath,
          locale,
          durationSeconds,
          lastVisibleSection: lastVisibleSectionRef.current,
          maxScrollPercent: maxScrollPercentRef.current,
        },
        keepalive,
      );
    };

    const updateScrollState = () => {
      scrollFrameRequested = false;
      maxScrollPercentRef.current = Math.max(
        maxScrollPercentRef.current,
        getScrollPercent(),
      );
      lastVisibleSectionRef.current =
        getCurrentSectionName(sections) || lastVisibleSectionRef.current;
    };

    const handleScroll = () => {
      if (scrollFrameRequested) return;
      scrollFrameRequested = true;
      window.requestAnimationFrame(updateScrollState);
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        flushDuration(false);
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        updateScrollState();
        flushDuration(true);
      }
    };

    const handlePageHide = () => {
      updateScrollState();
      flushDuration(true);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("/")) return;
      if (!isPurchaseCtaHref(href)) return;

      const ctaSection = getNearestSectionName(anchor);
      const ctaId = anchor.id || anchor.getAttribute("data-cta-id") || null;
      const ctaLabel = anchor.textContent?.replace(/\s+/g, " ").trim() || null;

      void postEvent(
        {
          eventType: "cta_click",
          sessionKey,
          pagePath,
          locale,
          ctaTarget: href,
          ctaId,
          ctaLabel,
          ctaSection,
          durationSeconds: Math.max(
            lastDurationSent,
            Math.floor((Date.now() - startedAt) / 1000),
          ),
          lastVisibleSection: lastVisibleSectionRef.current,
          maxScrollPercent: maxScrollPercentRef.current,
        },
        true,
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleClick, true);

    return () => {
      flushDuration(true);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClick, true);
    };
  }, [pageType]);

  return null;
}
