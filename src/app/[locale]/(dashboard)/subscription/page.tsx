// import { createClient } from '@/utils/supabase/server';
// import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SubscriptionContent } from '@/components/dashboard/SubscriptionContent';

export default async function SubscriptionPage() {
  // Supabase 임시 비활성화 - 테스트용
  const mockUser = {
    email: 'demo@flowspot.app',
  };

  const mockSubscription = {
    plan_name: 'Free Plan',
    status: 'active',
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return (
    <DashboardLayout user={mockUser}>
      <SubscriptionContent subscription={mockSubscription} />
    </DashboardLayout>
  );
}
