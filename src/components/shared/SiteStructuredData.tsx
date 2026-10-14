'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { isKimatchumSurface } from '@/lib/kimatchum/branding';

export function SiteStructuredData({siteUrl}:{siteUrl:string}) {
  const pathname=usePathname(),params=useSearchParams();
  if(isKimatchumSurface(pathname,params.get('redirect')))return null;
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'FlowSpot',url:siteUrl})}}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'Organization',name:'FlowSpot',url:siteUrl,logo:`${siteUrl}/og-image.png`})}}/>
  </>;
}
