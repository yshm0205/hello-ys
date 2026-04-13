'use client';

/**
 * 토스페이 결제 요청 훅
 * - pay.toss.im API 사용 (토스페이먼츠 아님)
 * - 서버에서 결제 생성 → checkoutPage URL로 리다이렉트
 */

import { useCallback, useState } from 'react';

export function useTossPay() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestPayment = useCallback(async (planType: string) => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/tosspay/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType }),
            });

            const data = await res.json();

            if (!res.ok || !data.checkoutPage) {
                setError(data.error || '결제 생성에 실패했습니다.');
                return;
            }

            // 토스페이 결제 페이지로 이동
            window.location.href = data.checkoutPage;
        } catch {
            setError('결제 요청에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    return { requestPayment, loading, error };
}
