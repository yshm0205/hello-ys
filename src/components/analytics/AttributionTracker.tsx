"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { attributionIdentity, entrySource } from "@/lib/marketing/attribution-browser";
import { pagePurpose } from "@/lib/marketing/attribution-model";
import type { AttributionInput } from "@/lib/marketing/attribution-model";

type LandingView = Readonly<{ section: string | null; scroll: number }>;

// MarketingTracker와 같은 기준: 화면 높이 55% 지점에 걸린 구간
function currentSection() {
  const anchor = window.innerHeight * 0.55;
  let closest: HTMLElement | null = null;
  let distance = Number.POSITIVE_INFINITY;
  for (const section of document.querySelectorAll<HTMLElement>("section[id], [data-marketing-section]")) {
    const rect = section.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue;
    if (rect.top <= anchor && rect.bottom >= anchor) { closest = section; break; }
    const gap = Math.min(Math.abs(rect.top - anchor), Math.abs(rect.bottom - anchor));
    if (gap < distance) { distance = gap; closest = section; }
  }
  return closest ? (closest.dataset.marketingSection || closest.id || null)?.slice(0, 120) ?? null : null;
}

function scrollPercent() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  return scrollable <= 1 ? 100 : Math.max(0, Math.min(100, Math.round((window.scrollY / scrollable) * 100)));
}

export function AttributionTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const purpose = pagePurpose(pathname);
    if (!purpose) return;
    let lastIdentity = "";
    let active = true;
    const send = async (kind: AttributionInput["kind"], view?: LandingView) => {
      try {
        const payload = {
          ...attributionIdentity(), id: crypto.randomUUID(), kind, path: pathname, ...view,
          source: kind === "page" ? entrySource() : null,
          referrerHost: document.referrer ? new URL(document.referrer).hostname : null,
          test: search.get("tracking_test") === "1" || sessionStorage.getItem("flowspot_tracking_test") === "1",
        };
        // Keep the same event ID on retry so a response lost in transit cannot double-count it.
        const body = JSON.stringify(payload);
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            const response = await fetch("/api/marketing/attribution", {
              method: "POST", headers: { "Content-Type": "application/json" }, body,
              keepalive: true, signal: AbortSignal.timeout(8000),
            });
            if (response.ok || response.status < 500) return;
          } catch (error) {
            if (!(error instanceof Error)) throw error;
            if (attempt === 1) console.warn("[Attribution] event delivery failed", error.name);
          }
        }
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        console.warn("[Attribution] browser storage unavailable", error.name);
      }
    };
    if (search.get("tracking_test") === "1") sessionStorage.setItem("flowspot_tracking_test", "1");
    void send("page");
    const client = createClient();
    const { data } = client.auth.onAuthStateChange((event, session) => {
      const userId = session?.user.id ?? "";
      if (event === "SIGNED_IN" && userId && userId !== lastIdentity && active) void send("identity");
      lastIdentity = userId;
    });
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest("a[href],button[data-marketing-cta]");
      if (!(element instanceof HTMLElement)) return;
      const href = element.getAttribute("href") ?? element.dataset.ctaTarget ?? "";
      if (/\/(?:ko\/|en\/)?login(?:[?#]|$)/.test(href)) void send("login_click");
      else if (href.includes("/checkout/allinone") || element.dataset.marketingCta === "purchase") void send("purchase_click");
    };
    document.addEventListener("click", onClick, true);
    let lastActivity = Date.now();
    const touchVisit = () => {
      if (Date.now() - lastActivity < 10000) return;
      lastActivity = Date.now();
      try { attributionIdentity(); }
      catch (error) { if (!(error instanceof Error)) throw error; }
    };
    // 랜딩에서는 화면을 가리거나 떠날 때마다 그때 보던 구간을 남긴다. 같은 위치면 다시 보내지 않는다.
    let maxScroll = 0;
    let scrollFrame = 0;
    let lastLeave = "";
    const trackScroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; maxScroll = Math.max(maxScroll, scrollPercent()); });
    };
    const onLeave = () => {
      if (purpose !== "landing") return;
      const view = { section: currentSection(), scroll: Math.max(maxScroll, scrollPercent()) };
      const key = `${view.section}:${view.scroll}`;
      if (key === lastLeave) return;
      lastLeave = key;
      void send("leave", view);
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") onLeave(); };
    window.addEventListener("scroll", touchVisit, { passive: true });
    window.addEventListener("scroll", trackScroll, { passive: true });
    document.addEventListener("keydown", touchVisit);
    document.addEventListener("pointerdown", touchVisit);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onLeave);
    return () => {
      active = false; data.subscription.unsubscribe(); document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", touchVisit); document.removeEventListener("keydown", touchVisit);
      document.removeEventListener("pointerdown", touchVisit);
      window.removeEventListener("scroll", trackScroll); cancelAnimationFrame(scrollFrame);
      document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pagehide", onLeave);
    };
  }, [pathname, search]);
  return null;
}
