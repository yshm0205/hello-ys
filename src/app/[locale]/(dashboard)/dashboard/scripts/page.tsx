import { createClient } from '@/utils/supabase/server';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ScriptGeneratorContent } from '@/components/dashboard/ScriptGeneratorContent';

export default async function ScriptGeneratorPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <DashboardLayout user={user || undefined}>
            <ScriptGeneratorContent user={user || undefined} />
        </DashboardLayout>
    );
}
