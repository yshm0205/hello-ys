import { createClient } from '@/utils/supabase/server';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ScriptGeneratorV2Content } from '@/components/dashboard/ScriptGeneratorV2Content';

export default async function ScriptGeneratorV2Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <DashboardLayout user={user || undefined}>
            <ScriptGeneratorV2Content user={user || undefined} />
        </DashboardLayout>
    );
}
