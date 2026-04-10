import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BatchGeneratorContent } from '@/components/dashboard/BatchGeneratorContent';

export default async function BatchPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <DashboardLayout user={user}>
            <BatchGeneratorContent user={user} />
        </DashboardLayout>
    );
}
