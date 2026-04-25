import { redirect } from 'next/navigation';

import { AllInOneCheckoutContent } from '@/components/checkout/AllInOneCheckoutContent';
import { getEffectiveCreditInfo } from '@/lib/plans/server';
import { createClient } from '@/utils/supabase/server';

interface AllInOneCheckoutPageProps {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<{ coupon?: string }>;
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

    if (!user) {
        const redirectTarget = initialCouponCode
            ? `/checkout/allinone?coupon=${encodeURIComponent(initialCouponCode)}`
            : '/checkout/allinone';

        redirect(`/${locale}/login?redirect=${encodeURIComponent(redirectTarget)}`);
    }

    const creditInfo = await getEffectiveCreditInfo(user.id);

    return (
        <AllInOneCheckoutContent
            userEmail={user.email}
            creditInfo={creditInfo}
            initialCouponCode={initialCouponCode}
        />
    );
}
