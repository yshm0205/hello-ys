import type { Metadata } from 'next';
import { isKimatchumDestination } from '@/lib/kimatchum/branding';
import { Suspense } from 'react';
import { resolvePostLoginRedirectPath } from '@/lib/plans/server';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { LoginContent } from './LoginContent';

interface LoginPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ redirect?: string }>;
}

export async function generateMetadata({searchParams}:LoginPageProps):Promise<Metadata>{
    const {redirect}=await searchParams;
    return isKimatchumDestination(redirect)?{title:{absolute:'키맞춤 로그인'},description:'기존 계정으로 인증하고 키맞춤 악보 작업실로 돌아오세요.',robots:{index:false,follow:false},openGraph:{title:'키맞춤 로그인',description:'키맞춤 악보 작업실 로그인',images:[]},twitter:{title:'키맞춤 로그인',images:[]}}:{};
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
