// import { createClient } from '@/utils/supabase/server';
// import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ArchiveContent } from '@/components/dashboard/ArchiveContent';

export default async function ArchivePage() {
    // Supabase 임시 비활성화 - 테스트용
    const mockUser = {
        email: 'demo@flowspot.app',
    };

    return (
        <DashboardLayout user={mockUser}>
            <ArchiveContent />
        </DashboardLayout>
    );
}
