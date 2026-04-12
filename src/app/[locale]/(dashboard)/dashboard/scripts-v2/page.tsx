import { createClient } from '@/utils/supabase/server';
import { ScriptGeneratorV2Content } from '@/components/dashboard/ScriptGeneratorV2Content';

export default async function ScriptGeneratorV2Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return <ScriptGeneratorV2Content user={user || undefined} />;
}
