'use client';

import { useCallback, useState } from 'react';

import {
  requestPortOneTossPayment,
  type CardCompanyCode,
  type PortOnePaymentMethod,
} from '@/lib/payments/portone-browser';

interface TossPayBuyerInfo {
  buyerEmail?: string;
}

export function useTossPay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const requestPayment = useCallback(
    async (
      planType: string,
      buyerInfo?: TossPayBuyerInfo,
      paymentMethod: PortOnePaymentMethod = 'CARD',
      cardCompany?: CardCompanyCode,
    ) => {
      setLoading(true);
      setError(null);
      setNotice(null);

      try {
        const { getMarketingSessionKeyFromBrowser, getMarketingTokenFromBrowser } = await import(
          '@/lib/marketing/tracking'
        );
        const res = await fetch('/api/tosspay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planType,
            ...buyerInfo,
            sessionKey: getMarketingSessionKeyFromBrowser(),
            marketingToken: getMarketingTokenFromBrowser(),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.paymentId) {
          setError(data.error || '결제 주문 생성에 실패했습니다.');
          return;
        }

        const portoneResult = await requestPortOneTossPayment({
          paymentId: data.paymentId,
          orderName: data.orderName,
          amount: data.amount,
          customerId: data.customerId,
          customerEmail: data.buyerEmail,
          paymentMethod,
          cardCompany,
        });

        if (!portoneResult.ok) {
          if (portoneResult.cancelled) {
            setNotice('결제를 취소했습니다.');
            return;
          }

          setError(portoneResult.error);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('PortOne all-in-one payment request failed:', err);
        setError(message || '결제 요청에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { requestPayment, loading, error, notice };
}
