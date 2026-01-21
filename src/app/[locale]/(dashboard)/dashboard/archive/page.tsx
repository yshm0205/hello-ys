import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ArchiveContent } from '@/components/dashboard/ArchiveContent';

export default async function ArchivePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <DashboardLayout user={user}>
            <ArchiveContent />
        </DashboardLayout>
    );
}
