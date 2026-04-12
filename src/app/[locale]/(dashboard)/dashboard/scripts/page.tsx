import { createClient } from '@/utils/supabase/server';
import { ScriptGeneratorContent } from '@/components/dashboard/ScriptGeneratorContent';

export default async function ScriptGeneratorPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return <ScriptGeneratorContent user={user || undefined} />;
}
