// import { createClient } from '@/utils/supabase/server';
// import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { HistoryContent } from '@/components/dashboard/HistoryContent';

export default async function HistoryPage() {
    // Supabase 임시 비활성화 - 테스트용
    const mockUser = {
        email: 'demo@flowspot.app',
    };

    return (
        <DashboardLayout user={mockUser}>
            <HistoryContent />
        </DashboardLayout>
    );
}
