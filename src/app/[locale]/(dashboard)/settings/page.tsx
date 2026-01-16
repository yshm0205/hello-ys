// import { createClient } from '@/utils/supabase/server';
// import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SettingsContent } from '@/components/dashboard/SettingsContent';

export default async function SettingsPage() {
  // Supabase 임시 비활성화 - 테스트용
  const mockUser = {
    email: 'demo@flowspot.app',
    id: 'demo-user-id',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockSubscription = {
    plan_name: 'Free Plan',
    status: 'active',
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return (
    <DashboardLayout user={{ email: mockUser.email }}>
      <SettingsContent
        user={mockUser}
        subscription={mockSubscription}
      />
    </DashboardLayout>
  );
}
