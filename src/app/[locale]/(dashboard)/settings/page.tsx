import { SettingsContent } from '@/components/dashboard/SettingsContent';
import { getPlanLabel, isActiveAccessPlan } from '@/lib/plans/config';
import { getEffectiveCreditInfo } from '@/lib/plans/server';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 새 결제 흐름(toss_payments) 호환 — 올인원/월구독 모두 인식
  const plan = await getEffectiveCreditInfo(user.id);
  const subscription = {
    plan_name: getPlanLabel(plan?.plan_type),
    status: isActiveAccessPlan(plan?.plan_type, plan?.expires_at) ? 'active' : 'inactive',
    current_period_end: plan?.expires_at ?? undefined,
  };

  return (
    <SettingsContent
      user={{
        email: user.email || '',
        id: user.id,
        created_at: user.created_at || '',
      }}
      subscription={subscription}
    />
  );
}
