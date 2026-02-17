import { createClient } from '@/utils/supabase/server';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CreditsContent } from '@/components/dashboard/CreditsContent';

export default async function CreditsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <DashboardLayout user={user || undefined}>
            <CreditsContent />
        </DashboardLayout>
    );
}
