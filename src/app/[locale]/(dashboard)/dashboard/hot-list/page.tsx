import { ChannelListContent } from '@/components/dashboard/ChannelListContent';
import { isActiveAccessPlan } from '@/lib/plans/config';
import { getEffectiveCreditInfo } from '@/lib/plans/server';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ChannelListPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 활성 구독자 확인 — toss_payments(올인원/월구독) 흐름 호환
    const plan = await getEffectiveCreditInfo(user.id);
    const isSubscribed = isActiveAccessPlan(plan?.plan_type, plan?.expires_at);

    return <ChannelListContent isSubscribed={isSubscribed} />;
}
