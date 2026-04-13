import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { LecturePlayerContent } from '@/components/dashboard/LecturePlayerContent';
import { getPublishedLectureChapters } from '@/lib/lectures/server';
import { isActiveAccessPlan } from '@/lib/plans/config';

interface LecturePageProps {
    params: Promise<{ vodId: string }>;
}

export default async function LecturePage({ params }: LecturePageProps) {
    const { vodId } = await params;
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
    const hasVod = chapters.some((chapter) =>
        chapter.vods.some((vod) => vod.id === vodId)
    );

    if (!hasVod) {
        redirect('/dashboard/lectures');
    }

    return (
        <LecturePlayerContent
            vodId={vodId}
            userEmail={user.email}
            chapters={chapters}
        />
    );
}
