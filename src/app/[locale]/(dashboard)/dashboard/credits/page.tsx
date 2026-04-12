import { createClient } from '@/utils/supabase/server';
import { CreditsContent } from '@/components/dashboard/CreditsContent';

export default async function CreditsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return <CreditsContent userId={user?.id} />;
}
