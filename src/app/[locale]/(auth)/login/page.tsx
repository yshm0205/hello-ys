import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { LoginContent } from './LoginContent';

interface LoginPageProps {
    searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const params = await searchParams;
    const redirectTarget =
        params.redirect && params.redirect.startsWith('/') && !params.redirect.startsWith('//')
            ? params.redirect
            : '/dashboard';

    if (user) {
        redirect(redirectTarget);
    }

    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
