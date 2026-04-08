import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LecturePlayerContent } from '@/components/dashboard/LecturePlayerContent';
import { getPublishedLectureChapters } from '@/lib/lectures/server';

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

    const chapters = await getPublishedLectureChapters();
    const hasVod = chapters.some((chapter) =>
        chapter.vods.some((vod) => vod.id === vodId)
    );

    if (!hasVod) {
        redirect('/dashboard/lectures');
    }

    return (
        <DashboardLayout user={user}>
            <LecturePlayerContent
                vodId={vodId}
                userEmail={user.email}
                chapters={chapters}
            />
        </DashboardLayout>
    );
}
