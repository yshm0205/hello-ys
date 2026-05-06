'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { Alert, Box, Button, Card, Checkbox, Container, Group, Text } from '@mantine/core';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck } from 'lucide-react';

import { Link } from '@/i18n/routing';
import {
  isActiveAccessPlan,
  isInitialProgramPlan,
  isMonthlySubscriberPlan,
  TOSSPAY_PLAN_CONFIG,
  type AppPlanType,
} from '@/lib/plans/config';

const REFUND_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSebxsymyHg8TKn5N_3XGr6CgTt0d-8tbmyDgqJkdNL3vbkzGg/viewform';

const checkoutItems = [
  {
    title: 'VOD 강의 40강',
    description: '4개월 수강권',
    image: '/images/product-vod.gif',
  },
  {
    title: 'AI 스크립트 도구',
    description: '4개월 이용 · 매월 400cr 지급',
    image: '/images/product-ai-script.gif',
  },
  {
    title: '트렌드 채널 데이터',
    description: '주제 선정/벤치마킹 자료',
    image: '/images/product-channel-list.gif',
  },
  {
    title: '전자책',
    description: '운영 흐름 자료',
    image: '/images/product-ebook.gif',
  },
  {
    title: '노션 운영 템플릿',
    description: '콘텐츠 관리 템플릿',
    image: '/images/product-notion.gif',
  },
];

interface CheckoutCreditInfo {
  credits: number;
  plan_type: AppPlanType | string;
  expires_at: string | null;
  monthly_credit_amount: number;
  monthly_credit_total_cycles: number | null;
  monthly_credit_granted_cycles: number;
  next_credit_at: string | null;
}

interface AppliedCoupon {
  code: string;
  label: string;
  description: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  expiresAt: string | null;
}

interface AllInOneCheckoutContentProps {
  userEmail?: string;
  creditInfo: CheckoutCreditInfo | null;
  initialCouponCode?: string;
  isAuthenticated?: boolean;
  checkoutIntent?: string;
  wasCancelled?: boolean;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatWon(amount: number) {
  return `${amount.toLocaleString()}원`;
}

function PolicyCard({
  title,
  teaser,
  children,
}: {
  title: string;
  teaser: string;
  children: ReactNode;
}) {
  return (
    <details className="fs-policy-card">
      <summary>
        <span>
          <strong>{title}</strong>
          <em>{teaser}</em>
        </span>
      </summary>
      <div className="fs-policy-body">{children}</div>
    </details>
  );
}

export function AllInOneCheckoutContent({
  userEmail,
  creditInfo,
  initialCouponCode = '',
  isAuthenticated = Boolean(userEmail),
  wasCancelled = false,
}: AllInOneCheckoutContentProps) {
  const locale = useLocale();
  const plan = TOSSPAY_PLAN_CONFIG.allinone;
  const totalGenerationCount = Math.floor(plan.totalCredits / 10);
  const hasActiveAccess = isAuthenticated && isActiveAccessPlan(creditInfo?.plan_type, creditInfo?.expires_at);
  const isInitialProgram = isInitialProgramPlan(creditInfo?.plan_type);
  const isMonthlySubscriber = isMonthlySubscriberPlan(creditInfo?.plan_type);

  const [confirmedCheckout, setConfirmedCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const finalCheckoutAmount = appliedCoupon?.finalAmount ?? plan.amount;
  const monthly12Final = Math.ceil(finalCheckoutAmount / 12);
  const totalDiscountAmount = Math.max(0, plan.listAmount - finalCheckoutAmount);
  const discountRate = Math.round((1 - finalCheckoutAmount / plan.listAmount) * 100);
  const canOpenPayment = confirmedCheckout;
  const primaryDisabled = isAuthenticated && !canOpenPayment;
  const primaryLabel = isAuthenticated
    ? `2차 얼리버드로 ${formatWon(finalCheckoutAmount)} 결제하기`
    : '로그인하고 결제 계속하기';

  const buildCheckoutRedirectTarget = () => {
    const params = new URLSearchParams();
    params.set('intent', 'pay');

    const couponCode = appliedCoupon?.code || initialCouponCode.trim();
    if (couponCode) {
      params.set('coupon', couponCode);
    }

    return `/checkout/allinone?${params.toString()}`;
  };

  const redirectToLogin = () => {
    const redirectTarget = buildCheckoutRedirectTarget();
    window.location.assign(`/${locale}/login?redirect=${encodeURIComponent(redirectTarget)}`);
  };

  const applyCoupon = async (rawCode: string) => {
    const normalizedCode = rawCode.trim().toUpperCase();

    if (!normalizedCode) {
      setAppliedCoupon(null);
      setError('쿠폰 코드를 입력해 주세요.');
      return;
    }

    setError(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: normalizedCode,
          context: 'allinone',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success || !data.coupon) {
        setAppliedCoupon(null);
        setError(data.error || '쿠폰 적용에 실패했습니다.');
        return;
      }

      setAppliedCoupon(data.coupon as AppliedCoupon);
    } catch (err) {
      const message = err instanceof Error ? err.message : '쿠폰 확인 중 오류가 발생했습니다.';
      setAppliedCoupon(null);
      setError(message);
    }
  };

  useEffect(() => {
    if (!initialCouponCode || !isAuthenticated) return;
    void applyCoupon(initialCouponCode);
    // initial coupon is a one-time bootstrap value from the server-rendered URL.
  }, [initialCouponCode, isAuthenticated]);

  const handleTossPayCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const { getMarketingSessionKeyFromBrowser, getMarketingTokenFromBrowser } = await import(
        '@/lib/marketing/tracking'
      );
      const res = await fetch('/api/tosspay/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'allinone',
          buyerEmail: userEmail,
          locale,
          couponCode: appliedCoupon?.code || null,
          sessionKey: getMarketingSessionKeyFromBrowser(),
          marketingToken: getMarketingTokenFromBrowser(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.checkoutPage) {
        setError(data.error || '결제 주문 생성에 실패했습니다.');
        return;
      }

      window.location.assign(data.checkoutPage);
    } catch (err) {
      const message = err instanceof Error ? err.message : '결제 요청에 실패했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    if (!canOpenPayment) return;
    await handleTossPayCheckout();
  };

  return (
    <Box className="fs-checkout-page">
      <style>{`
        .fs-checkout-page {
          min-height: 100vh;
          padding: 28px 0 112px;
          background: #f6f7fb;
          color: #111217;
        }

        .fs-checkout-shell {
          max-width: 1120px;
        }

        .fs-checkout-topbar,
        .fs-checkout-titlebar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .fs-checkout-topbar {
          margin-bottom: 16px;
          color: #71717a;
          font-size: 14px;
        }

        .fs-checkout-titlebar {
          margin-bottom: 14px;
          padding: 18px 20px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
        }

        .fs-checkout-titlebar h1 {
          margin: 0;
          font-size: 24px;
          line-height: 1.2;
          letter-spacing: 0;
        }

        .fs-checkout-secure {
          flex: 0 0 auto;
          color: #52525b;
          font-size: 13px;
          font-weight: 750;
        }

        .fs-select-wrap {
          display: grid;
          min-height: calc(100vh - 150px);
          place-items: center;
          padding: 28px 0 142px;
        }

        .fs-select-content {
          width: min(620px, 100%);
        }

        .fs-select-title {
          margin: 0 0 26px;
        }

        .fs-select-title h1 {
          margin: 0;
          font-size: 26px;
          line-height: 1.2;
          font-weight: 950;
          letter-spacing: 0;
        }

        .fs-select-title p {
          margin: 8px 0 0;
          color: #71717a;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 650;
        }

        .fs-select-section + .fs-select-section {
          margin-top: 34px;
        }

        .fs-select-heading {
          margin: 0 0 12px;
          font-size: 22px;
          line-height: 1.25;
          font-weight: 950;
          letter-spacing: 0;
        }

        .fs-select-option {
          width: 100%;
          min-height: 96px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 22px 24px;
          border: 1.5px solid #7c3aed;
          border-radius: 12px;
          background: #fff;
          color: #111217;
          text-align: left;
        }

        .fs-select-badge {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          margin-bottom: 9px;
          padding: 5px 9px;
          border-radius: 999px;
          background: #f5f3ff;
          color: #6d28d9;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 900;
        }

        .fs-select-option-title {
          display: block;
          font-size: 20px;
          line-height: 1.25;
          font-weight: 950;
        }

        .fs-select-option-sub {
          display: block;
          margin-top: 6px;
          color: #71717a;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 650;
        }

        .fs-select-price {
          flex: 0 0 auto;
          text-align: right;
        }

        .fs-select-price s {
          display: block;
          color: #71717a;
          font-size: 16px;
          line-height: 1.1;
        }

        .fs-select-price strong {
          display: block;
          margin-top: 6px;
          color: #111217;
          font-size: 21px;
          line-height: 1.1;
          font-weight: 950;
          white-space: nowrap;
        }

        .fs-select-price em {
          color: #7c3aed;
          font-style: normal;
        }

        .fs-included-card {
          width: 100%;
          min-height: 88px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 20px 24px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          color: #111217;
        }

        .fs-included-tag {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 54px;
          height: 30px;
          padding: 0 11px;
          border-radius: 999px;
          background: #f5f3ff;
          color: #6d28d9;
          font-size: 12px;
          font-weight: 900;
        }

        .fs-select-details {
          margin-top: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
        }

        .fs-select-details summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 15px 18px;
          color: #18181b;
          cursor: pointer;
          font-size: 14px;
          font-weight: 900;
          list-style: none;
        }

        .fs-select-details summary::-webkit-details-marker {
          display: none;
        }

        .fs-select-details summary::after {
          content: '+';
          color: #7c3aed;
          font-size: 18px;
          line-height: 1;
          font-weight: 900;
        }

        .fs-select-details[open] summary::after {
          content: '-';
        }

        .fs-select-detail-list {
          display: grid;
          gap: 10px;
          padding: 0 18px 16px;
        }

        .fs-select-detail-item {
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
        }

        .fs-select-detail-thumb {
          overflow: hidden;
          width: 44px;
          height: 36px;
          border: 1px solid #e5e7eb;
          border-radius: 9px;
          background: #f4f4f5;
        }

        .fs-select-detail-thumb img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .fs-select-detail-item strong {
          display: block;
          color: #18181b;
          font-size: 13px;
          line-height: 1.3;
          font-weight: 900;
        }

        .fs-select-detail-item span {
          display: block;
          margin-top: 2px;
          color: #71717a;
          font-size: 12px;
          line-height: 1.35;
        }

        .fs-select-bottom {
          position: fixed;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 30;
          display: flex;
          justify-content: center;
          padding: 20px 18px calc(20px + env(safe-area-inset-bottom));
          border-top: 1px solid #f1f5f9;
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 -12px 34px rgba(15, 23, 42, 0.08);
        }

        .fs-select-bottom-inner {
          width: min(620px, 100%);
        }

        .fs-select-bottom-summary {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .fs-select-benefit-label {
          color: #111217;
          font-size: 17px;
          line-height: 1.3;
          font-weight: 850;
        }

        .fs-select-bottom-price {
          text-align: right;
        }

        .fs-select-bottom-price s {
          color: #71717a;
          font-size: 16px;
        }

        .fs-select-bottom-price .arrow {
          color: #71717a;
          margin: 0 6px;
        }

        .fs-select-bottom-price .sale {
          color: #52525b;
          font-size: 18px;
        }

        .fs-select-bottom-price strong {
          display: block;
          margin-top: 6px;
          color: #111217;
          font-size: 24px;
          line-height: 1.1;
          font-weight: 950;
        }

        .fs-select-bottom-price em {
          color: #7c3aed;
          font-style: normal;
        }

        .fs-select-purchase-button {
          width: 100%;
          min-height: 64px;
          border: 0;
          border-radius: 14px;
          background: #7c3aed;
          color: #fff;
          font-size: 22px;
          font-weight: 950;
          cursor: pointer;
        }

        .fs-checkout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 384px;
          gap: 20px;
          align-items: start;
        }

        .fs-checkout-main {
          display: grid;
          gap: 14px;
        }

        .fs-panel {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
        }

        .fs-panel-section {
          padding: 22px;
        }

        .fs-section-title {
          margin: 0;
          font-size: 16px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: 0;
        }

        .fs-section-subtitle {
          margin: 5px 0 0;
          color: #71717a;
          font-size: 14px;
          line-height: 1.45;
        }

        .fs-checkout-items {
          display: grid;
          gap: 12px;
          margin-top: 14px;
        }

        .fs-checkout-item {
          display: grid;
          grid-template-columns: 76px minmax(0, 1fr);
          gap: 13px;
          align-items: center;
          min-height: 0;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
        }

        .fs-checkout-thumb {
          overflow: hidden;
          width: 76px;
          height: 62px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #f4f4f5;
        }

        .fs-checkout-thumb img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .fs-checkout-item h3 {
          margin: 0 0 4px;
          font-size: 15px;
          line-height: 1.3;
          font-weight: 900;
          letter-spacing: 0;
        }

        .fs-checkout-item p {
          margin: 0;
          color: #71717a;
          font-size: 13px;
          line-height: 1.45;
        }

        .fs-summary-panel {
          position: sticky;
          top: 22px;
          overflow: hidden;
        }

        .fs-summary-head {
          padding: 20px 20px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .fs-summary-badge {
          display: inline-flex;
          margin-bottom: 9px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f5f3ff;
          color: #6d28d9;
          font-size: 12px;
          font-weight: 850;
        }

        .fs-price-block {
          padding: 18px 20px;
        }

        .fs-price-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #52525b;
          font-size: 14px;
          line-height: 1.45;
        }

        .fs-price-row + .fs-price-row {
          margin-top: 9px;
        }

        .fs-price-row.discount {
          color: #ef4444;
        }

        .fs-total {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .fs-total-label {
          font-size: 14px;
          font-weight: 900;
        }

        .fs-installment {
          margin-top: 4px;
          color: #71717a;
          font-size: 12px;
        }

        .fs-total-amount {
          font-size: 28px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: 0;
        }

        .fs-payment-note {
          margin: 0 20px 18px;
          padding: 14px;
          border: 1px solid #ddd6fe;
          border-radius: 12px;
          background: #f5f3ff;
        }

        .fs-payment-note strong {
          display: block;
          color: #4c1d95;
          font-size: 14px;
          line-height: 1.35;
        }

        .fs-payment-note span {
          display: block;
          margin-top: 5px;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.5;
        }

        .fs-policy-list {
          display: grid;
          gap: 10px;
          padding: 0 20px 18px;
        }

        .fs-policy-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
        }

        .fs-policy-card summary {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 22px;
          gap: 12px;
          padding: 14px;
          color: #18181b;
          cursor: pointer;
          font-size: 14px;
          font-weight: 850;
          list-style: none;
        }

        .fs-policy-card summary::-webkit-details-marker {
          display: none;
        }

        .fs-policy-card summary::after {
          content: '+';
          display: grid;
          width: 22px;
          height: 22px;
          place-items: center;
          border-radius: 999px;
          background: #f4f4f5;
          color: #52525b;
          font-size: 16px;
          line-height: 1;
        }

        .fs-policy-card[open] summary::after {
          content: '-';
        }

        .fs-policy-card summary strong {
          display: block;
          line-height: 1.35;
        }

        .fs-policy-card summary em {
          display: block;
          margin-top: 4px;
          color: #71717a;
          font-size: 12px;
          font-style: normal;
          font-weight: 600;
          line-height: 1.45;
        }

        .fs-policy-body {
          padding: 0 14px 14px;
          color: #52525b;
          font-size: 13px;
          line-height: 1.6;
        }

        .fs-policy-body ul {
          margin: 0;
          padding-left: 18px;
        }

        .fs-policy-body a {
          color: #7c3aed;
          font-weight: 850;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .fs-agree {
          display: grid;
          gap: 10px;
          padding: 0 20px 20px;
        }

        .fs-agree-text {
          color: #27272a;
          font-size: 13px;
          line-height: 1.45;
        }

        .fs-pay-button {
          width: 100%;
          min-height: 54px;
          border: 0;
          border-radius: 12px;
          background: #7c3aed;
          color: #fff;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .fs-pay-button:disabled {
          background: #d4d4d8;
          color: #71717a;
          cursor: not-allowed;
        }

        .fs-secondary-button {
          width: 100%;
          min-height: 42px;
          border: 1px solid #e5e7eb;
          border-radius: 11px;
          background: #fff;
          color: #27272a;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
        }

        .fs-checkout-error {
          margin: 0 20px 20px;
        }

        .fs-mobile-bar {
          position: fixed;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 20;
          display: none;
          grid-template-columns: minmax(0, 1fr) 152px;
          gap: 12px;
          align-items: center;
          padding: 12px 14px calc(12px + env(safe-area-inset-bottom));
          border-top: 1px solid #e5e7eb;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 -12px 34px rgba(15, 23, 42, 0.1);
          backdrop-filter: blur(14px);
        }

        .fs-mobile-price small {
          display: block;
          color: #71717a;
          font-size: 12px;
          line-height: 1.2;
        }

        .fs-mobile-price strong {
          display: block;
          margin-top: 2px;
          font-size: 17px;
          line-height: 1.1;
          font-weight: 950;
        }

        .fs-mobile-bar .fs-pay-button {
          min-height: 48px;
          font-size: 14px;
        }

        @media (max-width: 820px) {
          .fs-checkout-page {
            padding: 16px 0 104px;
          }

          .fs-checkout-shell {
            padding-right: 14px;
            padding-left: 14px;
          }

          .fs-checkout-topbar {
            margin-bottom: 12px;
          }

          .fs-checkout-topbar .fs-checkout-secure,
          .fs-checkout-titlebar .fs-checkout-secure {
            display: none;
          }

          .fs-select-wrap {
            min-height: calc(100vh - 120px);
            align-items: start;
            padding: 24px 0 174px;
          }

          .fs-select-title {
            margin-bottom: 22px;
          }

          .fs-select-title h1 {
            font-size: 24px;
          }

          .fs-select-section + .fs-select-section {
            margin-top: 26px;
          }

          .fs-select-heading {
            font-size: 20px;
          }

          .fs-select-option {
            min-height: 86px;
            padding: 18px 16px;
            gap: 12px;
          }

          .fs-included-card {
            min-height: 78px;
            padding: 16px;
            gap: 12px;
          }

          .fs-included-tag {
            min-width: 46px;
            height: 28px;
            padding: 0 9px;
            font-size: 11px;
          }

          .fs-select-option-title {
            font-size: 18px;
          }

          .fs-select-price s {
            font-size: 13px;
          }

          .fs-select-price strong {
            font-size: 17px;
          }

          .fs-select-bottom {
            padding: 16px 14px calc(16px + env(safe-area-inset-bottom));
          }

          .fs-select-bottom-summary {
            gap: 12px;
            margin-bottom: 14px;
          }

          .fs-select-benefit-label {
            font-size: 15px;
          }

          .fs-select-bottom-price s,
          .fs-select-bottom-price .sale {
            font-size: 13px;
          }

          .fs-select-bottom-price strong {
            font-size: 20px;
          }

          .fs-select-purchase-button {
            min-height: 56px;
            border-radius: 13px;
            font-size: 19px;
          }

          .fs-checkout-titlebar {
            margin-bottom: 12px;
            padding: 14px 16px;
          }

          .fs-checkout-titlebar h1 {
            font-size: 22px;
          }

          .fs-checkout-grid {
            display: block;
          }

          .fs-checkout-main {
            gap: 12px;
          }

          .fs-panel-section {
            padding: 18px 18px 12px;
          }

          .fs-checkout-items {
            gap: 8px;
            margin-top: 10px;
          }

          .fs-checkout-item {
            grid-template-columns: 64px minmax(0, 1fr);
            gap: 10px;
            padding: 9px 10px;
          }

          .fs-checkout-thumb {
            width: 64px;
            height: 52px;
          }

          .fs-summary-panel {
            position: static;
            margin-top: 12px;
          }

          .fs-summary-head {
            padding: 16px 16px 12px;
          }

          .fs-price-block {
            padding: 14px 16px;
          }

          .fs-price-row {
            font-size: 13px;
          }

          .fs-price-row + .fs-price-row {
            margin-top: 6px;
          }

          .fs-total {
            align-items: center;
            margin-top: 12px;
            padding-top: 12px;
          }

          .fs-installment {
            display: none;
          }

          .fs-total-amount {
            position: relative;
            padding-top: 14px;
            font-size: 23px;
          }

          .fs-total-amount::before {
            content: '12개월 할부 시 월 ${formatWon(monthly12Final)}';
            position: absolute;
            top: 0;
            right: 0;
            color: #71717a;
            font-size: 11px;
            line-height: 1;
            font-weight: 650;
            white-space: nowrap;
          }

          .fs-payment-note {
            margin: 0 16px 12px;
            padding: 12px;
          }

          .fs-policy-list {
            gap: 8px;
            padding: 0 16px 14px;
          }

          .fs-policy-card summary {
            padding: 12px;
          }

          .fs-policy-card summary em {
            display: none;
          }

          .fs-agree {
            padding: 0 16px 18px;
          }

          .fs-mobile-bar {
            display: grid;
          }
        }
      `}</style>

      <Container fluid className="fs-checkout-shell">
        <Group className="fs-checkout-topbar">
          <Button component={Link} href="/" variant="subtle" color="gray" leftSection={<ChevronLeft size={16} />}>
            홈으로
          </Button>
          <span className="fs-checkout-secure">토스 보안 결제</span>
        </Group>

        {!isAuthenticated ? (
          <>
            <section className="fs-select-wrap">
              <div className="fs-select-content">
                <div className="fs-select-title">
                  <h1>올인원 패스 선택</h1>
                  <p>2차 얼리버드 혜택이 적용된 단일 구성입니다.</p>
                </div>

                <div className="fs-select-section">
                  <h1 className="fs-select-heading">수강권</h1>
                  <button type="button" className="fs-select-option" onClick={redirectToLogin}>
                    <span>
                      <span className="fs-select-badge">2차 얼리버드 적용 중</span>
                      <span className="fs-select-option-title">4개월 올인원 패스</span>
                      <span className="fs-select-option-sub">VOD 40강 · AI 도구 4개월 · 자료 패키지 포함</span>
                    </span>
                    <span className="fs-select-price">
                      <s>{formatWon(plan.listAmount)}</s>
                      <strong>
                        <em>{discountRate}%</em> {formatWon(finalCheckoutAmount)}
                      </strong>
                    </span>
                  </button>

                </div>

                <div className="fs-select-section">
                  <h2 className="fs-select-heading">포함 구성</h2>
                  <div className="fs-included-card">
                    <span>
                      <span className="fs-select-option-title">올인원 구성 포함</span>
                      <span className="fs-select-option-sub">
                        전자책 · 노션 템플릿 · 트렌드 채널 데이터 · 크레딧
                      </span>
                    </span>
                    <span className="fs-included-tag">포함</span>
                  </div>

                  <details className="fs-select-details">
                    <summary>포함 혜택 보기</summary>
                    <div className="fs-select-detail-list">
                      {checkoutItems.map((item) => (
                        <div className="fs-select-detail-item" key={item.title}>
                          <div className="fs-select-detail-thumb">
                            <Image src={item.image} alt="" width={44} height={36} unoptimized />
                          </div>
                          <div>
                            <strong>{item.title}</strong>
                            <span>{item.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            </section>

            <div className="fs-select-bottom">
              <div className="fs-select-bottom-inner">
                <div className="fs-select-bottom-summary">
                  <div className="fs-select-benefit-label">최대 혜택 적용 금액</div>
                  <div className="fs-select-bottom-price">
                    <div>
                      <s>{formatWon(plan.listAmount)}</s>
                      <span className="arrow">→</span>
                      <span className="sale">{formatWon(finalCheckoutAmount)}</span>
                    </div>
                    <strong>
                      <em>{discountRate}%</em> 월 {formatWon(monthly12Final)}
                    </strong>
                  </div>
                </div>
                <button type="button" className="fs-select-purchase-button" onClick={redirectToLogin}>
                  구매하기
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {wasCancelled && (
              <Alert mb="md" color="orange" radius="lg" variant="light" icon={<AlertCircle size={18} />}>
                결제가 취소되었습니다. 혜택은 아직 적용 중이니 다시 결제할 수 있습니다.
              </Alert>
            )}

            {hasActiveAccess ? (
              <Alert
                color="violet"
                radius="xl"
                variant="light"
                icon={<ShieldCheck size={18} />}
                title="이미 올인원 패스를 이용 중입니다"
              >
                이용 기간은 {formatDate(creditInfo?.expires_at)}까지입니다.
                {isInitialProgram && ' 이용권이 만료되기 전에는 중복 결제가 제한됩니다.'}
                {isMonthlySubscriber &&
                  ' 월 구독 상태에서는 추가 토큰만 대시보드에서 별도로 구매할 수 있습니다.'}
              </Alert>
            ) : (
              <>
                <div className="fs-checkout-grid">
              <div className="fs-checkout-main">
                <section className="fs-panel fs-panel-section">
                  <h2 className="fs-section-title">주문 정보</h2>
                  <p className="fs-section-subtitle">선택한 상품</p>
                  <div className="fs-checkout-items">
                    <article className="fs-checkout-item">
                      <div className="fs-checkout-thumb">
                        <Image src="/images/product-vod.gif" alt="" width={76} height={62} unoptimized />
                      </div>
                      <div>
                        <h3>원초적 인사이트 올인원 패스</h3>
                        <p>VOD 40강 · AI 도구 4개월 · 자료 패키지 포함</p>
                      </div>
                    </article>
                  </div>
                </section>
              </div>

              <aside className="fs-panel fs-summary-panel">
                <div className="fs-summary-head">
                  <span className="fs-summary-badge">결제 요약</span>
                  <h2 className="fs-section-title">원초적 인사이트 올인원 패스</h2>
                  <p className="fs-section-subtitle">VOD + AI 도구 + 데이터 + 전자책 + 노션 템플릿</p>
                  {userEmail && (
                    <Text mt={8} size="xs" c="gray.6">
                      로그인 계정: {userEmail}
                    </Text>
                  )}
                </div>

                <div className="fs-price-block">
                  <div className="fs-price-row">
                    <span>정가</span>
                    <span>{formatWon(plan.listAmount)}</span>
                  </div>
                  <div className="fs-price-row discount">
                    <span>{appliedCoupon ? appliedCoupon.label : '얼리버드 혜택'}</span>
                    <span>-{formatWon(totalDiscountAmount)}</span>
                  </div>
                  <div className="fs-total">
                    <div>
                      <div className="fs-total-label">최종 결제</div>
                      <div className="fs-installment">12개월 할부 시 월 {formatWon(monthly12Final)}</div>
                    </div>
                    <div className="fs-total-amount">{formatWon(finalCheckoutAmount)}</div>
                  </div>
                </div>

                <div className="fs-payment-note">
                  <strong>토스 보안 결제창에서 결제합니다</strong>
                  <span>카드, 토스머니, 계좌이체 등 실제 결제수단은 토스 화면에서 선택합니다.</span>
                </div>

                <div className="fs-policy-list">
                  <PolicyCard
                    title="환불 안내"
                    teaser="결제일, 수강/자료 이용 여부에 따라 환불 기준이 달라집니다."
                  >
                    <ul>
                      <li>결제일로부터 7일 이내, 수강/자료 이용/크레딧 사용 이력이 기준 이하인 경우 환불 검토가 가능합니다.</li>
                      <li>5강 이상 수강, 자료 다운로드, 크레딧 사용, 결제일로부터 28일 경과 시 환불이 제한될 수 있습니다.</li>
                      <li>
                        환불을 원하시면{' '}
                        <a href={REFUND_FORM_URL} target="_blank" rel="noopener noreferrer">
                          환불 신청서
                        </a>
                        를 작성해 주세요.
                      </li>
                    </ul>
                  </PolicyCard>

                  <PolicyCard
                    title="이용 조건 안내"
                    teaser="올인원 패스는 결제일로부터 4개월간 이용할 수 있습니다."
                  >
                    <ul>
                      <li>올인원 패스 이용 기간은 결제일로부터 {plan.months}개월입니다.</li>
                      <li>
                        AI 스크립트 도구는 매월 {plan.monthlyCredits.toLocaleString()}cr씩 지급됩니다.
                      </li>
                      <li>계정 공유, 강의/자료 무단 공유는 제한됩니다.</li>
                      <li>
                        총 {plan.totalCredits.toLocaleString()}cr 제공, 생성 {totalGenerationCount}편 분량입니다.
                      </li>
                    </ul>
                  </PolicyCard>
                </div>

                <div className="fs-agree">
                  {isAuthenticated ? (
                    <Checkbox
                      checked={confirmedCheckout}
                      onChange={(event) => setConfirmedCheckout(event.currentTarget.checked)}
                      label={
                        <span className="fs-agree-text">
                          결제 상품, 이용 기간, 환불 안내를 확인하고 결제에 동의합니다.
                        </span>
                      }
                    />
                  ) : (
                    <div className="fs-agree-text">
                      로그인 후 결제 동의와 토스 결제창 이동을 이어서 진행합니다.
                    </div>
                  )}

                  <button
                    type="button"
                    className="fs-pay-button"
                    disabled={primaryDisabled || loading}
                    onClick={handlePrimaryAction}
                  >
                    {loading ? '결제창 여는 중...' : primaryLabel}
                  </button>

                  <button
                    type="button"
                    className="fs-secondary-button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    구성품 다시 보기
                  </button>
                </div>

                {error && (
                  <Alert className="fs-checkout-error" color="red" radius="lg" variant="light" icon={<AlertCircle size={18} />}>
                    {error}
                  </Alert>
                )}
              </aside>
                </div>

                <div className="fs-mobile-bar">
                  <div className="fs-mobile-price">
                    <small>12개월 할부 시 월 {formatWon(monthly12Final)}</small>
                    <strong>{formatWon(finalCheckoutAmount)}</strong>
                  </div>
                  <button
                    type="button"
                    className="fs-pay-button"
                    disabled={primaryDisabled || loading}
                    onClick={handlePrimaryAction}
                  >
                    결제하기
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <Card mt="md" padding="md" radius="lg" withBorder style={{ borderColor: '#e5e7eb' }}>
          <Group gap={8} align="center">
            <CheckCircle2 size={16} color="#16a34a" />
            <Text size="xs" c="gray.6">
              결제 문제나 계정 이슈가 있으면 hmys0205hmys@gmail.com 으로 문의해 주세요.
            </Text>
          </Group>
        </Card>
      </Container>
    </Box>
  );
}
