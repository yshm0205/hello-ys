import { headers } from 'next/headers';

import {
  EARLYBIRD_FALLBACK_SUMMARY,
  getEarlybirdSummary,
} from '@/lib/marketing/earlybird';
import {
  getMarketingReviews,
  MARKETING_REVIEWS_FALLBACK,
} from '@/lib/marketing/reviews';
import LandingPage from './LandingPage';

export const dynamic = 'force-dynamic';

function detectIsMobileFromUserAgent(ua: string | null): boolean {
  if (!ua) return false;
  return /Mobile|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i.test(ua);
}

export default async function Page() {
  let initialSummary;
  let initialReviews;
  try {
    initialSummary = await getEarlybirdSummary();
  } catch (error) {
    console.error('[Landing] Failed to prefetch earlybird summary:', error);
    initialSummary = EARLYBIRD_FALLBACK_SUMMARY;
  }

  try {
    initialReviews = await getMarketingReviews();
  } catch (error) {
    console.error('[Landing] Failed to prefetch marketing reviews:', error);
    initialReviews = MARKETING_REVIEWS_FALLBACK;
  }

  const headerList = await headers();
  const initialIsMobile = detectIsMobileFromUserAgent(headerList.get('user-agent'));

  return (
    <LandingPage
      initialSummary={initialSummary}
      initialReviews={initialReviews}
      initialIsMobile={initialIsMobile}
    />
  );
}
