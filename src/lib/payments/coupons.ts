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
        | 'not_eligible'
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
const CHALLENGE_COUPON_CODES = new Set(['CHALLENGE1', 'CHALLENGE20']);
const CHALLENGE_DISCOUNT_STATUSES = ['candidate', 'granted'] as const;
const CHALLENGE_DISCOUNT_WINDOW_MS = 48 * 60 * 60 * 1000;

type AdminClient = ReturnType<typeof createAdminClient>;

type ChallengeDiscountRow = {
  discount_status: string;
  discount_amount: number | null;
  updated_at: string | null;
};

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

function validateCouponConstraints(
  coupon: CouponDefinition,
  originalAmount: number,
): CouponValidationResult | null {
  const now = new Date();
  const startsAt = parseIsoDate(coupon.startsAt);
  const expiresAt = parseIsoDate(coupon.expiresAt);

  if (startsAt && now < startsAt) {
    return {
      ok: false,
      reason: 'not_started',
      message: '아직 사용할 수 없는 쿠폰입니다.',
    };
  }

  if (expiresAt && now > expiresAt) {
    return {
      ok: false,
      reason: 'expired',
      message: '사용 기간이 지난 쿠폰입니다.',
    };
  }

  if (coupon.amountOff >= originalAmount) {
    return {
      ok: false,
      reason: 'amount_too_low',
      message: '할인 금액을 적용할 수 없습니다.',
    };
  }

  return null;
}

async function hasRedeemedCoupon(
  admin: AdminClient,
  userId: string,
  normalizedCode: string,
) {
  const { data, error } = await admin
    .from('toss_payments')
    .select('id')
    .eq('user_id', userId)
    .contains('metadata', { couponCode: normalizedCode })
    .in('status', [...REDEEMED_STATUSES])
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data && data.length > 0);
}

async function validateChallengeCoupon(options: {
  normalizedCode: string;
  context: CheckoutCouponContext;
  originalAmount: number;
  userId?: string | null;
}): Promise<CouponValidationResult> {
  if (options.context !== 'allinone') {
    return {
      ok: false,
      reason: 'invalid',
      message: '사용할 수 없는 쿠폰입니다.',
    };
  }

  if (!options.userId) {
    return {
      ok: false,
      reason: 'not_eligible',
      message: '로그인 후에 사용할 수 있는 챌린지 할인입니다.',
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('challenge_enrollments')
    .select('discount_status, discount_amount, updated_at')
    .eq('user_id', options.userId)
    .in('discount_status', [...CHALLENGE_DISCOUNT_STATUSES])
    .gt('discount_amount', 0)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = (data as ChallengeDiscountRow | null) ?? null;
  const discountAmount = Number(row?.discount_amount || 0);
  const discountUpdatedAt = parseIsoDate(row?.updated_at || undefined);

  if (!row || !Number.isFinite(discountAmount) || discountAmount <= 0 || !discountUpdatedAt) {
    return {
      ok: false,
      reason: 'not_eligible',
      message: '챌린지 할인 대상이 아니거나 아직 지급되지 않았습니다.',
    };
  }

  const expiresAt = new Date(
    discountUpdatedAt.getTime() + CHALLENGE_DISCOUNT_WINDOW_MS,
  ).toISOString();
  const coupon: CouponDefinition = {
    code: options.normalizedCode,
    label: '챌린지 완료 2만원 할인',
    description: '3일 챌린지 성실 참여자 전용 할인',
    context: 'allinone',
    amountOff: discountAmount,
    expiresAt,
  };

  const constraintError = validateCouponConstraints(coupon, options.originalAmount);
  if (constraintError) return constraintError;

  if (await hasRedeemedCoupon(admin, options.userId, options.normalizedCode)) {
    return {
      ok: false,
      reason: 'already_used',
      message: '이미 사용한 쿠폰입니다.',
    };
  }

  return {
    ok: true,
    coupon,
    originalAmount: options.originalAmount,
    discountAmount: coupon.amountOff,
    finalAmount: options.originalAmount - coupon.amountOff,
  };
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

  if (CHALLENGE_COUPON_CODES.has(normalizedCode)) {
    return validateChallengeCoupon({
      normalizedCode,
      context: options.context,
      originalAmount: options.originalAmount,
      userId: options.userId,
    });
  }

  const coupon = getCouponDefinition(normalizedCode);

  if (!coupon || coupon.context !== options.context) {
    return {
      ok: false,
      reason: 'invalid',
      message: '사용할 수 없는 쿠폰입니다.',
    } satisfies CouponValidationResult;
  }

  const constraintError = validateCouponConstraints(coupon, options.originalAmount);
  if (constraintError) return constraintError;

  if (options.userId) {
    const admin = createAdminClient();
    if (await hasRedeemedCoupon(admin, options.userId, normalizedCode)) {
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
