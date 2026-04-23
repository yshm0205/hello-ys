import {
  EARLYBIRD_FALLBACK_SUMMARY,
  getEarlybirdSummary,
} from '@/lib/marketing/earlybird';
import LandingPage from './LandingPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let initialSummary;
  try {
    initialSummary = await getEarlybirdSummary();
  } catch (error) {
    console.error('[Landing] Failed to prefetch earlybird summary:', error);
    initialSummary = EARLYBIRD_FALLBACK_SUMMARY;
  }
  return <LandingPage initialSummary={initialSummary} />;
}
