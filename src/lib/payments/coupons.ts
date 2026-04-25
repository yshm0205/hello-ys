import { createAdminClient } from '@/utils/supabase/admin';

export type CheckoutCouponContext = 'allinone';

type CouponDefinition = {
  code: string;
  label: string;
  description: string;
  context: CheckoutCouponContext;
  amountOff: number;
  startsAt?: string;
  expiresAt?: string;
};

export type CouponValidationResult =
  | {
      ok: true;
      coupon: CouponDefinition;
      originalAmount: number;
      discountAmount: number;
      finalAmount: number;
    }
  | {
      ok: false;
      reason:
        | 'missing'
        | 'invalid'
        | 'not_started'
        | 'expired'
        | 'already_used'
        | 'amount_too_low';
      message: string;
    };

const COUPON_DEFINITIONS: Record<string, CouponDefinition> = {
  EBOOK50: {
    code: 'EBOOK50',
    label: '전자책 구매자 전환 혜택',
    description: '전자책 구매자 전용 5만원 혜택',
    context: 'allinone',
    amountOff: 50000,
    startsAt: '2026-04-25T00:00:00+09:00',
    expiresAt: '2026-04-28T23:59:59+09:00',
  },
};

const REDEEMED_STATUSES = ['DONE', 'PARTIAL_CANCELLED'] as const;

function parseIsoDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function normalizeCouponCode(raw?: string | null) {
  return String(raw || '').trim().toUpperCase();
}

export function getCouponDefinition(code?: string | null) {
  const normalized = normalizeCouponCode(code);
  return normalized ? COUPON_DEFINITIONS[normalized] || null : null;
}

export async function validateCheckoutCoupon(options: {
  couponCode?: string | null;
  context: CheckoutCouponContext;
  originalAmount: number;
  userId?: string | null;
}) {
  const normalizedCode = normalizeCouponCode(options.couponCode);

  if (!normalizedCode) {
    return {
      ok: false,
      reason: 'missing',
      message: '쿠폰 코드를 입력해 주세요.',
    } satisfies CouponValidationResult;
  }

  const coupon = getCouponDefinition(normalizedCode);

  if (!coupon || coupon.context !== options.context) {
    return {
      ok: false,
      reason: 'invalid',
      message: '사용할 수 없는 쿠폰입니다.',
    } satisfies CouponValidationResult;
  }

  const now = new Date();
  const startsAt = parseIsoDate(coupon.startsAt);
  const expiresAt = parseIsoDate(coupon.expiresAt);

  if (startsAt && now < startsAt) {
    return {
      ok: false,
      reason: 'not_started',
      message: '아직 사용할 수 없는 쿠폰입니다.',
    } satisfies CouponValidationResult;
  }

  if (expiresAt && now > expiresAt) {
    return {
      ok: false,
      reason: 'expired',
      message: '사용 기간이 지난 쿠폰입니다.',
    } satisfies CouponValidationResult;
  }

  if (coupon.amountOff >= options.originalAmount) {
    return {
      ok: false,
      reason: 'amount_too_low',
      message: '할인 금액을 적용할 수 없습니다.',
    } satisfies CouponValidationResult;
  }

  if (options.userId) {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('toss_payments')
      .select('id')
      .eq('user_id', options.userId)
      .contains('metadata', { couponCode: normalizedCode })
      .in('status', [...REDEEMED_STATUSES])
      .limit(1);

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return {
        ok: false,
        reason: 'already_used',
        message: '이미 사용한 쿠폰입니다.',
      } satisfies CouponValidationResult;
    }
  }

  return {
    ok: true,
    coupon,
    originalAmount: options.originalAmount,
    discountAmount: coupon.amountOff,
    finalAmount: options.originalAmount - coupon.amountOff,
  } satisfies CouponValidationResult;
}
