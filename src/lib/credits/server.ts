import { isActiveAccessPlan } from "@/lib/plans/config";
import { createAdminClient } from "@/utils/supabase/admin";

export const CREDIT_COSTS = {
  generate_full: 10,
  generate_batch: 10,
  generate_skip: 7,
  research: 3,
  rewrite: 2,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;
export type CreditTransactionType =
  | "charge"
  | "usage"
  | "refund"
  | "manual_add"
  | "manual_deduct";

type CreditResult =
  | { success: true; status: number; credits: number; deducted: number; message: string }
  | { success: false; status: number; credits?: number; deducted?: number; error: string };

type CreditTransactionInput = {
  userId: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  adminNote?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function recordCreditTransaction({
  userId,
  type,
  amount,
  balanceAfter,
  description,
  adminNote = null,
  referenceId = null,
  metadata = null,
}: CreditTransactionInput) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("credit_transactions").insert({
    user_id: userId,
    type,
    amount,
    balance_after: balanceAfter,
    description,
    admin_note: adminNote,
    reference_id: referenceId,
    metadata,
  });

  if (error) {
    console.error("[Credits] Failed to record transaction:", error);
  }
}

export async function deductUserCredits(
  userId: string,
  action: CreditAction,
): Promise<CreditResult> {
  const cost = CREDIT_COSTS[action];

  if (!cost) {
    return {
      success: false,
      status: 400,
      error: `Unknown credit action: ${action}`,
    };
  }

  const adminClient = createAdminClient();

  const { data: plan, error: planError } = await adminClient
    .from("user_plans")
    .select("credits, plan_type, expires_at")
    .eq("user_id", userId)
    .single();

  if (planError || !plan) {
    return {
      success: false,
      status: 403,
      error: "사용자 플랜 정보를 찾을 수 없습니다.",
    };
  }

  if (
    plan.expires_at &&
    plan.plan_type !== "free" &&
    !isActiveAccessPlan(plan.plan_type, plan.expires_at)
  ) {
    return {
      success: false,
      status: 403,
      error: "이용권이 만료되었습니다.",
    };
  }

  if (plan.credits < cost) {
    return {
      success: false,
      status: 403,
      credits: plan.credits,
      error: `크레딧이 부족합니다. (필요: ${cost}cr, 보유: ${plan.credits}cr)`,
    };
  }

  const { data: updated, error: updateError } = await adminClient
    .from("user_plans")
    .update({ credits: plan.credits - cost })
    .eq("user_id", userId)
    .eq("credits", plan.credits)
    .select("credits")
    .single();

  if (updateError || !updated) {
    return {
      success: false,
      status: 409,
      error: "동시 요청 충돌이 발생했습니다. 다시 시도해 주세요.",
    };
  }

  await recordCreditTransaction({
    userId,
    type: "usage",
    amount: -cost,
    balanceAfter: updated.credits,
    description: `credit usage: ${action}`,
    metadata: { action, cost },
  });

  return {
    success: true,
    status: 200,
    credits: updated.credits,
    deducted: cost,
    message: `${cost}cr 사용 (보유: ${updated.credits}cr)`,
  };
}

export async function refundUserCredits(
  userId: string,
  amount: number,
  referenceId: string,
  reason: string,
): Promise<{ success: boolean; credits?: number }> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("refund_batch_item", {
    p_reference_id: referenceId,
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
  });

  if (error) {
    console.error("[Credits] refund_batch_item RPC failed:", error);
    return { success: false };
  }

  const result = data as { success: boolean; credits?: number; reason?: string };

  if (!result.success) {
    console.warn(`[Credits] Refund rejected: ${result.reason} (ref=${referenceId})`);
    return { success: false };
  }

  return { success: true, credits: result.credits };
}
