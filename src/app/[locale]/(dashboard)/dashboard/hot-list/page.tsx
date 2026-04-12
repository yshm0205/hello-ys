import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ChannelListContent } from '@/components/dashboard/ChannelListContent';

export default async function ChannelListPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 구독 상태 확인
    let isSubscribed = false;
    try {
        const { data } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', user.id)
            .single();
        isSubscribed = data?.status === 'active';
    } catch {
        // 구독 정보 없음 → 비수강생
    }

    return <ChannelListContent isSubscribed={isSubscribed} />;
}
