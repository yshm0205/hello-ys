'use client';

/**
 * 토스페이먼츠 결제 요청 훅
 * - loadTossPayments → payment.requestPayment (카드 결제창)
 * - successUrl/failUrl로 리다이렉트
 */

import { useCallback, useState } from 'react';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';

const PACK_AMOUNTS: Record<number, number> = {
    100: 14900,
    300: 34900,
    500: 54900,
    1000: 99900,
};

export function useTossPayment(customerKey: string | undefined) {
    const [loading, setLoading] = useState(false);

    const requestPayment = useCallback(async (packCr: number) => {
        const amount = PACK_AMOUNTS[packCr];
        if (!amount || !customerKey || !TOSS_CLIENT_KEY) return;

        setLoading(true);
        try {
            const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
            const payment = tossPayments.payment({ customerKey });

            const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            const origin = window.location.origin;

            await payment.requestPayment({
                method: 'CARD',
                amount: { currency: 'KRW', value: amount },
                orderId,
                orderName: `FlowSpot 크레딧 ${packCr}개`,
                successUrl: `${origin}/dashboard/credits/success`,
                failUrl: `${origin}/dashboard/credits/fail`,
            });
        } catch (err) {
            // 사용자 취소 등 — 무시
            console.error('결제 요청 실패:', err);
        } finally {
            setLoading(false);
        }
    }, [customerKey]);

    return { requestPayment, loading };
}
