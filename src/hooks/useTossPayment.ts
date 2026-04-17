'use client';

import { useCallback, useState } from 'react';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import { CREDIT_TOPUP_PACKS } from '@/lib/plans/config';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';

const PACK_AMOUNTS = Object.fromEntries(
    CREDIT_TOPUP_PACKS.map((pack) => [pack.credits, pack.amount]),
) as Record<number, number>;

export function useTossPayment(customerKey: string | undefined) {
    const [loading, setLoading] = useState(false);

    const requestPayment = useCallback(async (packCr: number) => {
        const amount = PACK_AMOUNTS[packCr];
        if (!amount || !TOSS_CLIENT_KEY) return;

        setLoading(true);
        try {
            const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
            const widgets = tossPayments.widgets({ customerKey: customerKey || ANONYMOUS });

            const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            const origin = window.location.origin;

            await widgets.requestPaymentWindow({
                orderId,
                orderName: `FlowSpot 크레딧 충전 ${packCr}cr`,
                amount: { currency: 'KRW', value: amount },
                successUrl: `${origin}/dashboard/credits/success`,
                failUrl: `${origin}/dashboard/credits/fail`,
            });
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            if (!errMsg.includes('UserCancel')) {
                console.error('결제 요청 실패:', err);
            }
        } finally {
            setLoading(false);
        }
    }, [customerKey]);

    return { requestPayment, loading };
}
