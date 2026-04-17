'use client';

import { useCallback, useState } from 'react';
import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk';

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
            const orderResponse = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pack: packCr }),
            });
            const orderData = await orderResponse.json();

            if (!orderResponse.ok || !orderData.success) {
                throw new Error(orderData.error || '결제 주문 생성에 실패했습니다.');
            }

            const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
            const widgets = tossPayments.widgets({ customerKey: customerKey || ANONYMOUS });
            const origin = window.location.origin;
            const currentLocale = window.location.pathname.split('/')[1] === 'en' ? 'en' : 'ko';

            await widgets.requestPaymentWindow({
                orderId: orderData.orderId,
                orderName: orderData.orderName,
                amount: { currency: 'KRW', value: amount },
                successUrl: `${origin}/${currentLocale}/dashboard/credits/success`,
                failUrl: `${origin}/${currentLocale}/dashboard/credits/fail`,
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
