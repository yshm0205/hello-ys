import { LecturesContent } from '@/components/dashboard/LecturesContent';
import { getPublishedLectureChapters } from '@/lib/lectures/server';
import { isActiveAccessPlan } from '@/lib/plans/config';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function LecturesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: plan } = await supabase
        .from('user_plans')
        .select('plan_type, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!isActiveAccessPlan(plan?.plan_type, plan?.expires_at)) {
        redirect('/pricing');
    }

    const chapters = await getPublishedLectureChapters();

    return <LecturesContent chapters={chapters} />;
}
