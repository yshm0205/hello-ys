"use client";

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { isKimatchumSurface } from '@/lib/kimatchum/branding';
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

export function ClientWidgets() {return <Suspense fallback={null}><RouteWidgets/></Suspense>;}

function RouteWidgets() {
  const pathname=usePathname(),params=useSearchParams();
  const isKimatchum=isKimatchumSurface(pathname,params.get('redirect'));
  const hasChannelTalk = Boolean(process.env.NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY);

  return (
    <>
      <CookieConsent />
      {!isKimatchum && (hasChannelTalk ? <ChannelTalkButton /> : <KakaoChatButton />)}
    </>
  );
}
