"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { attributionIdentity, entrySource } from "@/lib/marketing/attribution-browser";
import { pagePurpose } from "@/lib/marketing/attribution-model";
import type { AttributionInput } from "@/lib/marketing/attribution-model";

export function AttributionTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (!pagePurpose(pathname)) return;
    let lastIdentity = "";
    let active = true;
    const send = async (kind: AttributionInput["kind"]) => {
      try {
        const payload = {
          ...attributionIdentity(), id: crypto.randomUUID(), kind, path: pathname,
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
    window.addEventListener("scroll", touchVisit, { passive: true });
    document.addEventListener("keydown", touchVisit);
    document.addEventListener("pointerdown", touchVisit);
    return () => {
      active = false; data.subscription.unsubscribe(); document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", touchVisit); document.removeEventListener("keydown", touchVisit);
      document.removeEventListener("pointerdown", touchVisit);
    };
  }, [pathname, search]);
  return null;
}
