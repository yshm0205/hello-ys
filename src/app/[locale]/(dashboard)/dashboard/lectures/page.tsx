import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LecturesContent } from '@/components/dashboard/LecturesContent';

export default async function LecturesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <DashboardLayout user={user}>
            <LecturesContent />
        </DashboardLayout>
    );
}
