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

export type CreditPlanSnapshot = {
  credits: number;
  subscriptionCredits: number;
  purchasedCredits: number;
  planType: string;
  expiresAt: string | null;
  hasBuckets: boolean;
};

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

type CreditPlanRow = {
  credits?: number | null;
  subscription_credits?: number | null;
  purchased_credits?: number | null;
  plan_type?: string | null;
  expires_at?: string | null;
};

type CreditBalanceUpdateInput = {
  userId: string;
  current: CreditPlanSnapshot | null;
  subscriptionCredits: number;
  purchasedCredits: number;
  planType?: string;
  expiresAt?: string | null;
  extra?: Record<string, unknown>;
};

type CreditBalanceUpdateResult =
  | { success: true; plan: CreditPlanSnapshot }
  | { success: false; error: unknown };

type DeductCreditOptions = {
  referenceId?: string | null;
  metadata?: Record<string, unknown> | null;
  description?: string;
};

const FULL_PLAN_SELECT =
  "credits, subscription_credits, purchased_credits, plan_type, expires_at";
const LEGACY_PLAN_SELECT = "credits, plan_type, expires_at";

function normalizeCreditPlan(
  row: CreditPlanRow | null | undefined,
  hasBuckets: boolean,
): CreditPlanSnapshot | null {
  if (!row) return null;

  const credits = row.credits ?? 0;
  const subscriptionCredits = hasBuckets ? Math.max(0, row.subscription_credits ?? 0) : 0;
  const purchasedCredits = hasBuckets
    ? Math.max(0, row.purchased_credits ?? 0)
    : Math.max(0, credits);

  return {
    credits: subscriptionCredits + purchasedCredits,
    subscriptionCredits,
    purchasedCredits,
    planType: row.plan_type ?? "free",
    expiresAt: row.expires_at ?? null,
    hasBuckets,
  };
}

function createWritePayload(
  snapshot: CreditPlanSnapshot | null,
  input: Omit<CreditBalanceUpdateInput, "userId" | "current">,
) {
  const payload: Record<string, unknown> = {
    credits: input.subscriptionCredits + input.purchasedCredits,
    plan_type: input.planType ?? snapshot?.planType ?? "free",
    expires_at:
      input.expiresAt === undefined ? snapshot?.expiresAt ?? null : input.expiresAt,
    ...(input.extra || {}),
  };

  if (snapshot?.hasBuckets ?? true) {
    payload.subscription_credits = input.subscriptionCredits;
    payload.purchased_credits = input.purchasedCredits;
  }

  return payload;
}

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

export async function loadCreditPlanSnapshot(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<CreditPlanSnapshot | null> {
  const fullResult = await adminClient
    .from("user_plans")
    .select(FULL_PLAN_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (!fullResult.error) {
    return normalizeCreditPlan(fullResult.data as CreditPlanRow | null, true);
  }

  const isMissingBucketColumns =
    (fullResult.error as { code?: string } | null)?.code === "42703";

  if (!isMissingBucketColumns) {
    console.error("[Credits] Failed to load credit plan:", fullResult.error);
    return null;
  }

  const legacyResult = await adminClient
    .from("user_plans")
    .select(LEGACY_PLAN_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (legacyResult.error) {
    console.error("[Credits] Failed to load legacy credit plan:", legacyResult.error);
    return null;
  }

  return normalizeCreditPlan(legacyResult.data as CreditPlanRow | null, false);
}

export async function updateCreditPlanBalances(
  adminClient: ReturnType<typeof createAdminClient>,
  input: CreditBalanceUpdateInput,
): Promise<CreditBalanceUpdateResult> {
  const nextSubscriptionCredits = Math.max(0, input.subscriptionCredits);
  const nextPurchasedCredits = Math.max(0, input.purchasedCredits);
  const nextPlanType = input.planType ?? input.current?.planType ?? "free";
  const nextExpiresAt =
    input.expiresAt === undefined ? input.current?.expiresAt ?? null : input.expiresAt;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const payload = createWritePayload(input.current, {
      subscriptionCredits: nextSubscriptionCredits,
      purchasedCredits: nextPurchasedCredits,
      planType: nextPlanType,
      expiresAt: nextExpiresAt,
      extra: input.extra,
    });

    if (!input.current) {
      const { data, error } = await adminClient
        .from("user_plans")
        .insert({
          user_id: input.userId,
          ...payload,
        })
        .select(FULL_PLAN_SELECT)
        .single();

      if (!error && data) {
        return {
          success: true,
          plan: normalizeCreditPlan(data as CreditPlanRow, true)!,
        };
      }

      const errorCode = (error as { code?: string } | null)?.code;
      if (errorCode === "23505") {
        input.current = await loadCreditPlanSnapshot(adminClient, input.userId);
        continue;
      }

      if (errorCode === "42703") {
        const { data: legacyData, error: legacyError } = await adminClient
          .from("user_plans")
          .insert({
            user_id: input.userId,
            credits: nextSubscriptionCredits + nextPurchasedCredits,
            plan_type: nextPlanType,
            expires_at: nextExpiresAt,
            ...(input.extra || {}),
          })
          .select(LEGACY_PLAN_SELECT)
          .single();

        if (!legacyError && legacyData) {
          return {
            success: true,
            plan: normalizeCreditPlan(legacyData as CreditPlanRow, false)!,
          };
        }

        return { success: false, error: legacyError };
      }

      return { success: false, error };
    }

    let updateQuery = adminClient
      .from("user_plans")
      .update(payload)
      .eq("user_id", input.userId)
      .eq("credits", input.current.credits)
      .eq("plan_type", input.current.planType);

    updateQuery = input.current.expiresAt
      ? updateQuery.eq("expires_at", input.current.expiresAt)
      : updateQuery.is("expires_at", null);

    if (input.current.hasBuckets) {
      updateQuery = updateQuery
        .eq("subscription_credits", input.current.subscriptionCredits)
        .eq("purchased_credits", input.current.purchasedCredits);
    }

    const selectColumns = input.current.hasBuckets ? FULL_PLAN_SELECT : LEGACY_PLAN_SELECT;
    const { data, error } = await updateQuery.select(selectColumns).single();

    if (!error && data) {
      return {
        success: true,
        plan: normalizeCreditPlan(data as CreditPlanRow, input.current.hasBuckets)!,
      };
    }

    const errorCode = (error as { code?: string } | null)?.code;
    if (errorCode && errorCode !== "PGRST116") {
      return { success: false, error };
    }

    input.current = await loadCreditPlanSnapshot(adminClient, input.userId);
  }

  return { success: false, error: new Error("concurrent_credit_update") };
}

export async function deductUserCredits(
  userId: string,
  action: CreditAction,
  options: DeductCreditOptions = {},
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
  const plan = await loadCreditPlanSnapshot(adminClient, userId);

  if (!plan) {
    return {
      success: false,
      status: 403,
      error: "사용자 플랜 정보를 찾을 수 없습니다.",
    };
  }

  const hasActivePlanAccess =
    !plan.expiresAt ||
    plan.planType === "free" ||
    isActiveAccessPlan(plan.planType, plan.expiresAt);
  const availableSubscriptionCredits = hasActivePlanAccess ? plan.subscriptionCredits : 0;
  const totalAvailableCredits = availableSubscriptionCredits + plan.purchasedCredits;

  if (!hasActivePlanAccess && plan.planType !== "free" && plan.purchasedCredits <= 0) {
    return {
      success: false,
      status: 403,
      error: "이용권이 만료되었습니다.",
    };
  }

  if (totalAvailableCredits < cost) {
    return {
      success: false,
      status: 403,
      credits: totalAvailableCredits,
      error: `크레딧이 부족합니다. (필요: ${cost}cr, 보유: ${totalAvailableCredits}cr)`,
    };
  }

  const deductedFromSubscription = Math.min(availableSubscriptionCredits, cost);
  const deductedFromPurchased = cost - deductedFromSubscription;

  const updateResult = await updateCreditPlanBalances(adminClient, {
    userId,
    current: plan,
    subscriptionCredits: hasActivePlanAccess
      ? plan.subscriptionCredits - deductedFromSubscription
      : 0,
    purchasedCredits: plan.purchasedCredits - deductedFromPurchased,
  });

  if (!updateResult.success) {
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
    balanceAfter: updateResult.plan.credits,
    description: options.description ?? `credit usage: ${action}`,
    referenceId: options.referenceId ?? null,
    metadata: {
      action,
      cost,
      subscriptionDeducted: deductedFromSubscription,
      purchasedDeducted: deductedFromPurchased,
      subscriptionCreditsAfter: updateResult.plan.subscriptionCredits,
      purchasedCreditsAfter: updateResult.plan.purchasedCredits,
      ...(options.metadata || {}),
    },
  });

  return {
    success: true,
    status: 200,
    credits: updateResult.plan.credits,
    deducted: cost,
    message: `${cost}cr 사용 (보유: ${updateResult.plan.credits}cr)`,
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
