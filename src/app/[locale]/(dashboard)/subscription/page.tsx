import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SubscriptionContent } from '@/components/dashboard/SubscriptionContent';

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 구독 정보 가져오기
  let subscription = null;
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    subscription = data;
  } catch {
    // 구독 정보 없음
  }

  const mockSubscription = subscription || {
    plan_name: 'Free Plan',
    status: 'active',
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return (
    <DashboardLayout user={user}>
      <SubscriptionContent subscription={mockSubscription} />
    </DashboardLayout>
  );
}
