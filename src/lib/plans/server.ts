import {
  PLAN_TYPE,
  TOSSPAY_PLAN_CONFIG,
  type AppPlanType,
} from "@/lib/plans/config";
import { createAdminClient } from "@/utils/supabase/admin";

export type EffectiveCreditInfo = {
  credits: number;
  plan_type: AppPlanType | string;
  expires_at: string | null;
  monthly_credit_amount: number;
  monthly_credit_total_cycles: number | null;
  monthly_credit_granted_cycles: number;
  next_credit_at: string | null;
};

type FullPlanRow = {
  credits: number;
  plan_type: string;
  expires_at: string | null;
  monthly_credit_amount?: number | null;
  monthly_credit_total_cycles?: number | null;
  monthly_credit_granted_cycles?: number | null;
  next_credit_at?: string | null;
};

type LegacyPlanRow = {
  credits: number;
  plan_type: string;
  expires_at: string | null;
};

const FULL_PLAN_SELECT =
  "credits, plan_type, expires_at, monthly_credit_amount, monthly_credit_total_cycles, monthly_credit_granted_cycles, next_credit_at";
const LEGACY_PLAN_SELECT = "credits, plan_type, expires_at";

function addMonths(iso: string, months: number) {
  const next = new Date(iso);
  next.setMonth(next.getMonth() + months);
  return next.toISOString();
}

type PartialEffectiveCreditInfo = {
  credits?: number | null;
  plan_type?: string | null;
  expires_at?: string | null;
  monthly_credit_amount?: number | null;
  monthly_credit_total_cycles?: number | null;
  monthly_credit_granted_cycles?: number | null;
  next_credit_at?: string | null;
};

function normalizePlanInfo(plan: PartialEffectiveCreditInfo | null | undefined): EffectiveCreditInfo | null {
  if (!plan) return null;
  return {
    credits: plan.credits ?? 0,
    plan_type: plan.plan_type ?? PLAN_TYPE.FREE,
    expires_at: plan.expires_at ?? null,
    monthly_credit_amount: plan.monthly_credit_amount ?? 0,
    monthly_credit_total_cycles: plan.monthly_credit_total_cycles ?? null,
    monthly_credit_granted_cycles: plan.monthly_credit_granted_cycles ?? 0,
    next_credit_at: plan.next_credit_at ?? null,
  };
}

async function getProgramPaymentFallback(userId: string): Promise<EffectiveCreditInfo | null> {
  const admin = createAdminClient();
  const config = TOSSPAY_PLAN_CONFIG.allinone;

  const { data: payment } = await admin
    .from("toss_payments")
    .select("updated_at, credits, metadata")
    .eq("user_id", userId)
    .eq("status", "DONE")
    .contains("metadata", { planType: "allinone" })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment?.updated_at) {
    return null;
  }

  return {
    credits: payment.credits ?? 0,
    plan_type: PLAN_TYPE.STUDENT_4M,
    expires_at: addMonths(payment.updated_at, config.months),
    monthly_credit_amount: config.monthlyCredits,
    monthly_credit_total_cycles: config.months,
    monthly_credit_granted_cycles: 1,
    next_credit_at: addMonths(payment.updated_at, 1),
  };
}

export async function getEffectiveCreditInfo(userId: string): Promise<EffectiveCreditInfo | null> {
  const admin = createAdminClient();

  const fullResult = await admin
    .from("user_plans")
    .select(FULL_PLAN_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (!fullResult.error && fullResult.data) {
    const fullPlan = normalizePlanInfo(fullResult.data as FullPlanRow);

    if (fullPlan?.plan_type === PLAN_TYPE.FREE) {
      const fallback = await getProgramPaymentFallback(userId);
      if (fallback) {
        return {
          ...fallback,
          credits: fullPlan.credits,
        };
      }
    }

    return fullPlan;
  }

  const isMissingMonthlyColumns =
    (fullResult.error as { code?: string } | null)?.code === "42703";

  const legacyResult = await admin
    .from("user_plans")
    .select(LEGACY_PLAN_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (legacyResult.error && !legacyResult.data && !isMissingMonthlyColumns) {
    return null;
  }

  const legacyPlan = normalizePlanInfo(legacyResult.data as LegacyPlanRow | null);
  const fallback = await getProgramPaymentFallback(userId);

  if (!fallback) {
    return legacyPlan;
  }

  if (!legacyPlan) {
    return fallback;
  }

  if (legacyPlan.plan_type === PLAN_TYPE.FREE) {
    return {
      ...fallback,
      credits: legacyPlan.credits,
    };
  }

  return legacyPlan;
}
