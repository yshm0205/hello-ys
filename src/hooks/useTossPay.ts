'use client';

import { useCallback, useState } from 'react';

interface TossPayBuyerInfo {
    buyerEmail?: string;
}

export function useTossPay() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestPayment = useCallback(async (planType: string, buyerInfo?: TossPayBuyerInfo) => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/tosspay/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType, ...buyerInfo }),
            });

            const data = await res.json();

            if (!res.ok || !data.checkoutPage) {
                setError(data.error || '결제 생성에 실패했습니다.');
                return;
            }

            window.location.href = data.checkoutPage;
        } catch {
            setError('결제 요청에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    return { requestPayment, loading, error };
}
