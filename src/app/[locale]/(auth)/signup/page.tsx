import { Suspense } from 'react';
import { resolvePostLoginRedirectPath } from '@/lib/plans/server';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { SignupContent } from './SignupContent';

interface SignupPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ redirect?: string }>;
}

export default async function SignupPage({ params, searchParams }: SignupPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { locale } = await params;
    const resolvedSearchParams = await searchParams;
    const redirectTarget =
        resolvedSearchParams.redirect &&
        resolvedSearchParams.redirect.startsWith('/') &&
        !resolvedSearchParams.redirect.startsWith('//')
            ? resolvedSearchParams.redirect
            : '/checkout/allinone';

    if (user) {
        const postLoginRedirect = await resolvePostLoginRedirectPath(user.id, redirectTarget);
        redirect(`/${locale}${postLoginRedirect}`);
    }

    return (
        <Suspense>
            <SignupContent />
        </Suspense>
    );
}
