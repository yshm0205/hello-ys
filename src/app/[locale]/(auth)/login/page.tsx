import { Suspense } from 'react';
import { resolvePostLoginRedirectPath } from '@/lib/plans/server';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { LoginContent } from './LoginContent';

interface LoginPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { locale } = await params;
    const resolvedSearchParams = await searchParams;
    const redirectTarget =
        resolvedSearchParams.redirect &&
        resolvedSearchParams.redirect.startsWith('/') &&
        !resolvedSearchParams.redirect.startsWith('//')
            ? resolvedSearchParams.redirect
            : '/dashboard';

    if (user) {
        const postLoginRedirect = await resolvePostLoginRedirectPath(user.id, redirectTarget);
        redirect(`/${locale}${postLoginRedirect}`);
    }

    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
