// import { createClient } from '@/utils/supabase/server';
// import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ScriptGeneratorContent } from '@/components/dashboard/ScriptGeneratorContent';

export default async function ScriptGeneratorPage() {
    // Supabase 임시 비활성화 - 테스트용
    const mockUser = {
        email: 'demo@flowspot.app',
    };

    return (
        <DashboardLayout user={mockUser}>
            <ScriptGeneratorContent />
        </DashboardLayout>
    );
}
