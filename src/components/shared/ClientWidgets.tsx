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

const ChannelTalkButton = dynamic(
  () =>
    import("@/components/shared/ChannelTalkButton").then(
      (mod) => mod.ChannelTalkButton
    ),
  { ssr: false }
);

export function ClientWidgets() {
  const hasChannelTalk = Boolean(process.env.NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY);

  return (
    <>
      <CookieConsent />
      {hasChannelTalk ? <ChannelTalkButton /> : <KakaoChatButton />}
    </>
  );
}
