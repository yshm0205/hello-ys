import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { LoginContent } from './LoginContent';

export default async function LoginPage() {
    // 이미 로그인된 사용자는 대시보드로 리다이렉트
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        redirect('/dashboard');
    }

    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
