import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LecturePlayerContent } from '@/components/dashboard/LecturePlayerContent';

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

    return (
        <DashboardLayout user={user}>
            <LecturePlayerContent vodId={vodId} userEmail={user.email} />
        </DashboardLayout>
    );
}
