import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { LecturePlayerContent } from '@/components/dashboard/LecturePlayerContent';
import { getLectureAccessForUser } from '@/lib/challenge/access';
import { getPublishedLectureChapters } from '@/lib/lectures/server';
import { getEffectiveCreditInfo } from '@/lib/plans/server';

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

    const plan = await getEffectiveCreditInfo(user.id);
    const access = await getLectureAccessForUser(user.id, plan);

    if (access.mode === 'none') {
        redirect('/pricing');
    }

    const chapters = await getPublishedLectureChapters();
    const hasVod = chapters.some((chapter) =>
        chapter.vods.some((vod) => vod.id === vodId)
    );

    if (!hasVod) {
        redirect('/dashboard/lectures');
    }

    if (access.mode === 'challenge' && !access.allowedVodIds.includes(vodId)) {
        redirect(`/dashboard/lectures?lockedVod=${encodeURIComponent(vodId)}`);
    }

    return (
        <LecturePlayerContent
            vodId={vodId}
            userEmail={user.email}
            chapters={chapters}
            accessMode={access.mode}
            allowedVodIds={access.allowedVodIds || []}
        />
    );
}
