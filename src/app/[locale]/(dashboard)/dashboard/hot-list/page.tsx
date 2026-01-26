import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { HotListContent } from '@/components/dashboard/HotListContent';

export default async function HotListPage() {
    const supabase = await createClient();

    // 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();

    // 비로그인 시 로그인 페이지로 리다이렉트
    if (!user) {
        redirect('/login');
    }

    return (
        <DashboardLayout user={user}>
            <HotListContent />
        </DashboardLayout>
    );
}
