import { LecturesContent } from '@/components/dashboard/LecturesContent';
import { LatpeedPaymentPendingContent } from '@/components/dashboard/LatpeedPaymentPendingContent';
import { getLectureAccessForUser } from '@/lib/challenge/access';
import { getPublishedLectureChapters } from '@/lib/lectures/server';
import { getRecentLatpeedPaymentIntent } from '@/lib/payments/latpeed-pending';
import { getEffectiveCreditInfo } from '@/lib/plans/server';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function LecturesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const plan = await getEffectiveCreditInfo(user.id);
    const access = await getLectureAccessForUser(user.id, plan);

    if (access.mode === 'none') {
        const pendingIntent = await getRecentLatpeedPaymentIntent(user.id);

        if (pendingIntent) {
            return (
                <LatpeedPaymentPendingContent
                    userEmail={pendingIntent.user_email || user.email || ''}
                    intentCreatedAt={pendingIntent.created_at}
                    intentExpiresAt={pendingIntent.expires_at}
                />
            );
        }

        redirect('/checkout/allinone?intent=pay');
    }

    const chapters = await getPublishedLectureChapters();

    return (
        <LecturesContent
            chapters={chapters}
            accessMode={access.mode}
            allowedVodIds={access.allowedVodIds || []}
        />
    );
}
