import { AllInOneCheckoutContent } from '@/components/checkout/AllInOneCheckoutContent';
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
    const initialCouponCode =
        typeof resolvedSearchParams?.coupon === 'string'
            ? resolvedSearchParams.coupon
            : '';
    const checkoutIntent =
        typeof resolvedSearchParams?.intent === 'string'
            ? resolvedSearchParams.intent
            : '';
    const wasCancelled = resolvedSearchParams?.cancelled === '1';
    const creditInfo = user ? await getEffectiveCreditInfo(user.id) : null;

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
