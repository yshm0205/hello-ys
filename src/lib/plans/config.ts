export const PLAN_TYPE = {
  FREE: "free",
  STUDENT_4M: "student_4m",
  SUBSCRIBER_MONTHLY: "subscriber_monthly",
  EXPIRED: "expired",
  LEGACY_ALLINONE: "allinone",
  LEGACY_PRO: "pro",
} as const;

export type AppPlanType = (typeof PLAN_TYPE)[keyof typeof PLAN_TYPE];

export const ACTIVE_ACCESS_PLAN_TYPES = new Set<string>([
  PLAN_TYPE.STUDENT_4M,
  PLAN_TYPE.SUBSCRIBER_MONTHLY,
  PLAN_TYPE.LEGACY_ALLINONE,
  PLAN_TYPE.LEGACY_PRO,
]);

export const PAID_PLAN_TYPES = [
  PLAN_TYPE.STUDENT_4M,
  PLAN_TYPE.SUBSCRIBER_MONTHLY,
  PLAN_TYPE.LEGACY_ALLINONE,
  PLAN_TYPE.LEGACY_PRO,
] as const;

export const TOSSPAY_PLAN_CONFIG = {
  allinone: {
    paymentKind: "initial_program",
    userPlanType: PLAN_TYPE.STUDENT_4M,
    listAmount: 599000,
    amount: 499000,
    initialCredits: 400,
    monthlyCredits: 400,
    months: 4,
    totalCredits: 1600,
    name: "4개월 프로그램",
  },
} as const;

export const CREDIT_TOPUP_PACKS = [
  { credits: 100, amount: 19900, popular: false },
  { credits: 300, amount: 49000, popular: false },
  { credits: 500, amount: 79000, popular: true },
  { credits: 1000, amount: 149000, popular: false },
] as const;

export const MONTHLY_SUBSCRIPTION_PREVIEW = {
  amount: 39000,
  monthlyCredits: 400,
  name: "월 구독",
} as const;

export type TossPayPlanType = keyof typeof TOSSPAY_PLAN_CONFIG;

export function isTossPayPlanType(value: string): value is TossPayPlanType {
  return value in TOSSPAY_PLAN_CONFIG;
}

export function isActiveAccessPlan(planType?: string | null, expiresAt?: string | null) {
  if (!planType || !ACTIVE_ACCESS_PLAN_TYPES.has(planType)) {
    return false;
  }

  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt) >= new Date();
}

export function isPaidPlanType(planType?: string | null) {
  return Boolean(planType && PAID_PLAN_TYPES.includes(planType as (typeof PAID_PLAN_TYPES)[number]));
}

export function isActivePaidPlan(planType?: string | null, expiresAt?: string | null) {
  return isPaidPlanType(planType) && isActiveAccessPlan(planType, expiresAt);
}

export function isExpiredPaidPlan(planType?: string | null, expiresAt?: string | null) {
  return isPaidPlanType(planType) && !isActiveAccessPlan(planType, expiresAt);
}

export function isInitialProgramPlan(planType?: string | null) {
  return planType === PLAN_TYPE.STUDENT_4M || planType === PLAN_TYPE.LEGACY_ALLINONE;
}

export function isMonthlySubscriberPlan(planType?: string | null) {
  return planType === PLAN_TYPE.SUBSCRIBER_MONTHLY || planType === PLAN_TYPE.LEGACY_PRO;
}

export function getPlanLabel(planType?: string | null) {
  switch (planType) {
    case PLAN_TYPE.STUDENT_4M:
    case PLAN_TYPE.LEGACY_ALLINONE:
      return "올인원 패스";
    case PLAN_TYPE.SUBSCRIBER_MONTHLY:
    case PLAN_TYPE.LEGACY_PRO:
      return "월 구독";
    case PLAN_TYPE.EXPIRED:
      return "만료";
    default:
      return "무료";
  }
}

export function getPlanCreditDisplayCap(planType?: string | null) {
  switch (planType) {
    case PLAN_TYPE.STUDENT_4M:
    case PLAN_TYPE.LEGACY_ALLINONE:
      return TOSSPAY_PLAN_CONFIG.allinone.totalCredits;
    case PLAN_TYPE.SUBSCRIBER_MONTHLY:
    case PLAN_TYPE.LEGACY_PRO:
      return TOSSPAY_PLAN_CONFIG.allinone.monthlyCredits;
    default:
      return 0;
  }
}
