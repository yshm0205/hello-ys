import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();

  // 비로그인 시 로그인 페이지로 리다이렉트
  if (!user) {
    redirect('/login');
  }

  // 구독 정보 가져오기 (테이블이 있다면)
  let subscription = null;
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    subscription = data;
  } catch {
    // 구독 정보 없을 경우 기본값
  }

  const mockSubscription = subscription || {
    plan_name: 'Free Plan',
    status: 'active',
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return (
    <DashboardLayout user={user}>
      <DashboardContent
        user={user}
        subscription={mockSubscription}
      />
    </DashboardLayout>
  );
}
