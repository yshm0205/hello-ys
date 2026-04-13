import { createClient } from '@/utils/supabase/server';
import { CreditsContent } from '@/components/dashboard/CreditsContent';

export default async function CreditsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);
    const isAdmin = !!user?.email && adminEmails.includes(user.email);

    return <CreditsContent userId={user?.id} isAdmin={isAdmin} />;
}
