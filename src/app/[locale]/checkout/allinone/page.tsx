import { redirect } from 'next/navigation';

import { AllInOneCheckoutContent } from '@/components/checkout/AllInOneCheckoutContent';
import { getEffectiveCreditInfo } from '@/lib/plans/server';
import { createClient } from '@/utils/supabase/server';

interface AllInOneCheckoutPageProps {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<{ coupon?: string; intent?: string; cancelled?: string }>;
}

export default async function AllInOneCheckoutPage({
    params,
    searchParams,
}: AllInOneCheckoutPageProps) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const { locale } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const initialCouponCode =
        typeof resolvedSearchParams?.coupon === 'string'
            ? resolvedSearchParams.coupon
            : '';
    const checkoutIntent =
        typeof resolvedSearchParams?.intent === 'string'
            ? resolvedSearchParams.intent
            : '';
    const wasCancelled = resolvedSearchParams?.cancelled === '1';

    if (!user) {
        const redirectParams = new URLSearchParams();
        redirectParams.set('intent', checkoutIntent || 'pay');
        if (initialCouponCode) {
            redirectParams.set('coupon', initialCouponCode);
        }

        const redirectTarget = `/checkout/allinone?${redirectParams.toString()}`;
        redirect(`/${locale}/login?redirect=${encodeURIComponent(redirectTarget)}`);
    }

    const creditInfo = await getEffectiveCreditInfo(user.id);

    return (
        <AllInOneCheckoutContent
            userEmail={user?.email}
            creditInfo={creditInfo}
            initialCouponCode={initialCouponCode}
            isAuthenticated
            checkoutIntent={checkoutIntent}
            wasCancelled={wasCancelled}
        />
    );
}
