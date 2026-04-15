import { redirect } from 'next/navigation';

import { AllInOneCheckoutContent } from '@/components/checkout/AllInOneCheckoutContent';
import { getEffectiveCreditInfo } from '@/lib/plans/server';
import { createClient } from '@/utils/supabase/server';

interface AllInOneCheckoutPageProps {
    params: Promise<{ locale: string }>;
}

export default async function AllInOneCheckoutPage({ params }: AllInOneCheckoutPageProps) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const { locale } = await params;

    if (!user) {
        redirect(`/${locale}/login?redirect=/checkout/allinone`);
    }

    const creditInfo = await getEffectiveCreditInfo(user.id);

    return (
        <AllInOneCheckoutContent
            userEmail={user.email}
            creditInfo={creditInfo}
        />
    );
}
