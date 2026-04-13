export const TOSSPAY_PLAN_CONFIG = {
  allinone: {
    amount: 99000,
    credits: 160,
    months: 4,
    creditsPerMonth: 40,
    name: "올인원 4개월 프로그램",
  },
} as const;

export type TossPayPlanType = keyof typeof TOSSPAY_PLAN_CONFIG;

export function isTossPayPlanType(value: string): value is TossPayPlanType {
  return value in TOSSPAY_PLAN_CONFIG;
}
