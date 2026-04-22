'use client';

import { useCallback, useState } from 'react';

import { requestPortOneTossPayment } from '@/lib/payments/portone-browser';

export function useTossPayment(customerKey: string | undefined, customerEmail?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const requestPayment = useCallback(
    async (packCr: number) => {
      setLoading(true);
      setError(null);
      setNotice(null);

      try {
        const orderResponse = await fetch('/api/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pack: packCr }),
        });
        const orderData = await orderResponse.json();

        if (!orderResponse.ok || !orderData.success || !orderData.paymentId) {
          setError(orderData.error || '결제 주문 생성에 실패했습니다.');
          return;
        }

        const portoneResult = await requestPortOneTossPayment({
          paymentId: orderData.paymentId,
          orderName: orderData.orderName,
          amount: orderData.amount,
          customerId: customerKey || orderData.customerId,
          customerEmail,
        });

        if (!portoneResult.ok) {
          if (portoneResult.cancelled) {
            setNotice('결제를 취소했습니다.');
            return;
          }

          setError(portoneResult.error);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('추가 크레딧 결제 요청 실패:', err);
        setError(errMsg || '결제 요청에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [customerEmail, customerKey],
  );

  return { requestPayment, loading, error, notice };
}
