import { AllInOneCheckoutContent } from '@/components/checkout/AllInOneCheckoutContent';
import { validateCheckoutCoupon } from '@/lib/payments/coupons';
import { TOSSPAY_PLAN_CONFIG } from '@/lib/plans/config';
import { getEffectiveCreditInfo } from '@/lib/plans/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

interface AllInOneCheckoutPageProps {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<{ coupon?: string; intent?: string; cancelled?: string }>;
}

export default async function AllInOneCheckoutPage({
    searchParams,
}: AllInOneCheckoutPageProps) {
    const cookieStore = await cookies();
    const hasAuthCookie = cookieStore.getAll().some(({ name, value }) => {
        return Boolean(value) && /^sb-.+-auth-token(?:\.\d+)?$/.test(name);
    });
    const user = hasAuthCookie
        ? (await (await createClient()).auth.getUser()).data.user
        : null;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    let initialCouponCode =
        typeof resolvedSearchParams?.coupon === 'string'
            ? resolvedSearchParams.coupon
            : '';
    const checkoutIntent =
        typeof resolvedSearchParams?.intent === 'string'
            ? resolvedSearchParams.intent
            : '';
    const wasCancelled = resolvedSearchParams?.cancelled === '1';
    const creditInfo = user ? await getEffectiveCreditInfo(user.id) : null;

    if (!initialCouponCode && user) {
        const challengeCoupon = await validateCheckoutCoupon({
            couponCode: 'CHALLENGE20',
            context: 'allinone',
            originalAmount: TOSSPAY_PLAN_CONFIG.allinone.amount,
            userId: user.id,
        }).catch(() => null);

        if (challengeCoupon?.ok) {
            initialCouponCode = challengeCoupon.coupon.code;
        }
    }

    return (
        <AllInOneCheckoutContent
            userEmail={user?.email}
            creditInfo={creditInfo}
            initialCouponCode={initialCouponCode}
            isAuthenticated={Boolean(user)}
            checkoutIntent={checkoutIntent}
            wasCancelled={wasCancelled}
        />
    );
}
