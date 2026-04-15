"use client";

import dynamic from "next/dynamic";

const CookieConsent = dynamic(
  () =>
    import("@/components/ui/cookie-consent").then((mod) => mod.CookieConsent),
  { ssr: false }
);

const KakaoChatButton = dynamic(
  () =>
    import("@/components/shared/KakaoChatButton").then(
      (mod) => mod.KakaoChatButton
    ),
  { ssr: false }
);

export function ClientWidgets() {
  return (
    <>
      <CookieConsent />
      <KakaoChatButton />
    </>
  );
}
