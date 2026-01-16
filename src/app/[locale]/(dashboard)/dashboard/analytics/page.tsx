// import { createClient } from '@/utils/supabase/server';
// import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AnalyticsContent } from '@/components/dashboard/AnalyticsContent';

export default async function AnalyticsPage() {
    // Supabase 임시 비활성화 - 테스트용
    const mockUser = {
        email: 'demo@flowspot.app',
    };

    return (
        <DashboardLayout user={mockUser}>
            <AnalyticsContent />
        </DashboardLayout>
    );
}
