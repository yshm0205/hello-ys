import { LecturesContent } from '@/components/dashboard/LecturesContent';
import { getPublishedLectureChapters } from '@/lib/lectures/server';
import { isActiveAccessPlan } from '@/lib/plans/config';
import { getEffectiveCreditInfo } from '@/lib/plans/server';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function LecturesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const plan = await getEffectiveCreditInfo(user.id);

    if (!isActiveAccessPlan(plan?.plan_type, plan?.expires_at)) {
        redirect('/pricing');
    }

    const chapters = await getPublishedLectureChapters();

    return <LecturesContent chapters={chapters} />;
}
