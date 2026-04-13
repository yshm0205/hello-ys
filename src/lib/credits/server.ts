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
      error: "?ъ슜???뚮옖 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.",
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
      error: "?댁슜沅뚯씠 留뚮즺?섏뿀?듬땲??",
    };
  }

  if (plan.credits < cost) {
    return {
      success: false,
      status: 403,
      credits: plan.credits,
      error: `?щ젅?㏃씠 遺議깊빀?덈떎. (?꾩슂: ${cost}cr, 蹂댁쑀: ${plan.credits}cr)`,
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
      error: "?숈떆 ?붿껌 異⑸룎??諛쒖깮?덉뒿?덈떎. ?ㅼ떆 ?쒕룄??二쇱꽭??",
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
    message: `${cost}cr ?ъ슜 (蹂댁쑀: ${updated.credits}cr)`,
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
