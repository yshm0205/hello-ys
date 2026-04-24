import { PaymentClient } from "@portone/server-sdk";

import {
  loadCreditPlanSnapshot,
  recordCreditTransaction,
  updateCreditPlanBalances,
} from "@/lib/credits/server";
import {
  getStoredGrantedPurchasedCredits as getSnapshotGrantedPurchasedCredits,
  getStoredGrantedSubscriptionCredits as getSnapshotGrantedSubscriptionCredits,
  getStoredGrantedTotalCredits,
} from "@/lib/payments/grant-snapshot";
import { notifyTelegramPaymentCompleted } from "@/lib/telegram/payments";
import { TOSSPAY_PLAN_CONFIG } from "@/lib/tosspay/config";
import { sendPaymentCompleteEmail } from "@/services/email/actions";
import { createAdminClient } from "@/utils/supabase/admin";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || "";

const PORTONE_LOCKABLE_STATUSES = [
  "PENDING",
  "READY",
  "PAY_PENDING",
  "FAILED",
  "CREDIT_GRANT_FAILED",
  "CONFIRM_FAILED",
] as const;

const PORTONE_CANCELLED_STATUSES = ["CANCELLED", "PARTIAL_CANCELLED"] as const;

type ExistingUserPlanRow = {
  credits: number;
  subscription_credits?: number | null;
  purchased_credits?: number | null;
  monthly_credit_granted_cycles: number | null;
  next_credit_at: string | null;
};

type PaymentEmailRow = {
  user_id: string;
  order_id?: string;
  order_name?: string | null;
  amount: number;
  metadata?: Record<string, unknown> | null;
};

type StoredPaymentRow = {
  user_id: string;
  order_id: string;
  order_name: string | null;
  amount: number;
  credits: number | null;
  status: string;
  payment_key: string | null;
  metadata?: Record<string, unknown> | null;
};

type PortOneFinalizeSuccess = {
  success: true;
  paymentKind: "credit_topup" | "initial_program";
  added: number;
  credits: number;
  orderName: string;
  message: string;
};

type PortOneFinalizeFailure = {
  success: false;
  pending?: boolean;
  status?: string;
  error: string;
};

export type PortOneFinalizeResult = PortOneFinalizeSuccess | PortOneFinalizeFailure;

type PortOneFinalizeOptions = {
  userId?: string;
  forceRefresh?: boolean;
};

function getPaymentClient() {
  if (!PORTONE_API_SECRET) {
    throw new Error("PORTONE_API_SECRET is not configured.");
  }

  return PaymentClient({ secret: PORTONE_API_SECRET });
}

function isLegacySchemaError(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  return code === "42703" || code === "23514";
}

async function notifyPaymentCompleteByEmail(
  admin: ReturnType<typeof createAdminClient>,
  payment: PaymentEmailRow,
  grantedCredits: number,
) {
  let buyerEmail =
    typeof payment.metadata?.buyerEmail === "string" ? payment.metadata.buyerEmail : "";

  if (!buyerEmail) {
    const { data, error } = await admin.auth.admin.getUserById(payment.user_id);

    if (error) {
      console.error("[PortOne] Failed to resolve email from auth:", error);
    } else {
      buyerEmail = data.user?.email || "";
    }
  }

  if (!buyerEmail) {
    console.warn("[PortOne] Payment complete email skipped: missing_email");
    return;
  }

  try {
    const result = await sendPaymentCompleteEmail({
      email: buyerEmail,
      userName: buyerEmail.split("@")[0] || "고객",
      amount: payment.amount,
      grantedCredits,
    });

    if (result.error) {
      console.error("[PortOne] Payment complete email failed:", result.error);
    }
  } catch (error) {
    console.error("[PortOne] Payment complete email failed:", error);
  }
}

async function notifyPaymentCompleteByTelegram(
  admin: ReturnType<typeof createAdminClient>,
  payment: PaymentEmailRow,
  grantedCredits: number,
) {
  let buyerEmail =
    typeof payment.metadata?.buyerEmail === "string" ? payment.metadata.buyerEmail : "";
  let buyerName = "";

  const { data, error } = await admin.auth.admin.getUserById(payment.user_id);
  if (error) {
    console.error("[PortOne] Failed to resolve profile for telegram:", error);
  } else {
    buyerEmail = buyerEmail || data.user?.email || "";
    buyerName =
      (typeof data.user?.user_metadata?.full_name === "string" &&
        data.user.user_metadata.full_name) ||
      (typeof data.user?.user_metadata?.name === "string" && data.user.user_metadata.name) ||
      "";
  }

  await notifyTelegramPaymentCompleted({
    userId: payment.user_id,
    email: buyerEmail,
    name: buyerName || buyerEmail.split("@")[0] || "",
    amount: payment.amount,
    grantedCredits,
    orderId:
      typeof payment.order_id === "string"
        ? payment.order_id
        : typeof payment.metadata?.orderId === "string"
          ? payment.metadata.orderId
          : undefined,
    orderName:
      typeof payment.order_name === "string" ? payment.order_name : "FlowSpot 결제",
    paymentKind:
      typeof payment.metadata?.paymentKind === "string" ? payment.metadata.paymentKind : null,
    provider:
      typeof payment.metadata?.provider === "string" ? payment.metadata.provider : "portone",
    paymentId:
      typeof payment.metadata?.paymentId === "string"
        ? payment.metadata.paymentId
        : typeof payment.metadata?.payToken === "string"
          ? payment.metadata.payToken
          : undefined,
    planType: typeof payment.metadata?.planType === "string" ? payment.metadata.planType : null,
    paidAt: new Date().toISOString(),
  });
}

async function applyLegacyProgramCreditsOnly(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  creditsToAdd: number,
): Promise<{ success: true; credits: number } | { success: false; error: unknown }> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: currentPlan, error: loadError } = await admin
      .from("user_plans")
      .select("credits")
      .eq("user_id", userId)
      .maybeSingle();

    if (loadError) {
      return { success: false, error: loadError };
    }

    const currentCredits = currentPlan?.credits || 0;
    const nextCredits = currentCredits + creditsToAdd;

    if (!currentPlan) {
      const { data: inserted, error: insertError } = await admin
        .from("user_plans")
        .insert({
          user_id: userId,
          plan_type: "free",
          credits: nextCredits,
        })
        .select("credits")
        .single();

      if (!insertError && inserted) {
        return { success: true, credits: inserted.credits };
      }

      if ((insertError as { code?: string } | null)?.code === "23505") {
        continue;
      }

      return { success: false, error: insertError };
    }

    const { data: updated, error: updateError } = await admin
      .from("user_plans")
      .update({ credits: nextCredits })
      .eq("user_id", userId)
      .eq("credits", currentCredits)
      .select("credits")
      .single();

    if (updated) {
      return { success: true, credits: updated.credits };
    }

    const updateErrorCode = (updateError as { code?: string } | null)?.code;
    if (updateError && updateErrorCode !== "PGRST116") {
      return { success: false, error: updateError };
    }
  }

  return { success: false, error: new Error("concurrent_legacy_credit_update") };
}

async function applyInitialProgramPlan(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  config: (typeof TOSSPAY_PLAN_CONFIG)[keyof typeof TOSSPAY_PLAN_CONFIG],
  subscriptionCredits: number,
  expiresAtIso: string,
  nextCreditAtIso: string,
  purchasedBonusCredits = 0,
): Promise<{ success: true; credits: number } | { success: false; error: unknown }> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: currentPlan, error: loadError } = await admin
      .from("user_plans")
      .select(
        "credits, subscription_credits, purchased_credits, monthly_credit_granted_cycles, next_credit_at",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (loadError) {
      return { success: false, error: loadError };
    }

    const planRow = currentPlan as ExistingUserPlanRow | null;
    const nextSubscriptionCredits = Math.max(0, Number(subscriptionCredits || 0));
    const nextPurchasedCredits = (planRow?.purchased_credits || 0) + purchasedBonusCredits;
    const nextCredits = nextSubscriptionCredits + nextPurchasedCredits;

    if (!planRow) {
      const { data: inserted, error: insertError } = await admin
        .from("user_plans")
        .insert({
          user_id: userId,
          plan_type: config.userPlanType,
          credits: nextCredits,
          subscription_credits: nextSubscriptionCredits,
          purchased_credits: nextPurchasedCredits,
          expires_at: expiresAtIso,
          monthly_credit_amount: config.monthlyCredits,
          monthly_credit_total_cycles: config.months,
          monthly_credit_granted_cycles: 1,
          next_credit_at: nextCreditAtIso,
        })
        .select("credits")
        .single();

      if (!insertError && inserted) {
        return { success: true, credits: inserted.credits };
      }

      if ((insertError as { code?: string } | null)?.code === "23505") {
        continue;
      }

      return { success: false, error: insertError };
    }

    let updateQuery = admin
      .from("user_plans")
      .update({
        plan_type: config.userPlanType,
        credits: nextCredits,
        subscription_credits: nextSubscriptionCredits,
        purchased_credits: nextPurchasedCredits,
        expires_at: expiresAtIso,
        monthly_credit_amount: config.monthlyCredits,
        monthly_credit_total_cycles: config.months,
        monthly_credit_granted_cycles: 1,
        next_credit_at: nextCreditAtIso,
      })
      .eq("user_id", userId)
      .eq("subscription_credits", planRow.subscription_credits ?? 0)
      .eq("purchased_credits", planRow.purchased_credits ?? 0);

    updateQuery =
      planRow.monthly_credit_granted_cycles === null
        ? updateQuery.is("monthly_credit_granted_cycles", null)
        : updateQuery.eq(
            "monthly_credit_granted_cycles",
            planRow.monthly_credit_granted_cycles,
          );

    updateQuery = planRow.next_credit_at
      ? updateQuery.eq("next_credit_at", planRow.next_credit_at)
      : updateQuery.is("next_credit_at", null);

    const { data: updated, error: updateError } = await updateQuery
      .select("credits")
      .single();

    if (updated) {
      return { success: true, credits: updated.credits };
    }

    const updateErrorCode = (updateError as { code?: string } | null)?.code;
    if (updateError && updateErrorCode !== "PGRST116") {
      return { success: false, error: updateError };
    }
  }

  return { success: false, error: new Error("concurrent_plan_update") };
}

async function readStoredPayment(paymentId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("toss_payments")
    .select("user_id, order_id, order_name, amount, credits, status, payment_key, metadata")
    .eq("payment_key", paymentId)
    .maybeSingle();

  return {
    admin,
    payment: (data as StoredPaymentRow | null) ?? null,
    error,
  };
}

async function buildCompletedResult(
  admin: ReturnType<typeof createAdminClient>,
  payment: StoredPaymentRow,
): Promise<PortOneFinalizeSuccess> {
  const creditPlan = await loadCreditPlanSnapshot(admin, payment.user_id);
  const paymentKind =
    payment.metadata?.paymentKind === "initial_program" ? "initial_program" : "credit_topup";
  const added = payment.credits ?? getStoredGrantedTotalCredits(payment.metadata, 0);

  return {
    success: true,
    paymentKind,
    added,
    credits: creditPlan?.credits ?? 0,
    orderName:
      payment.order_name ||
      (paymentKind === "initial_program" ? "FlowSpot 올인원" : "FlowSpot 크레딧 충전"),
    message:
      paymentKind === "initial_program"
        ? "올인원 결제가 완료되었습니다."
        : `${added}cr 충전이 완료되었습니다.`,
  };
}

function getStoredGrantedCredits(payment: StoredPaymentRow) {
  return payment.credits ?? getStoredGrantedTotalCredits(payment.metadata, 0);
}

function getStoredPurchasedGrantedCredits(payment: StoredPaymentRow) {
  return getSnapshotGrantedPurchasedCredits(payment.metadata, 0);
}

function getCancelledAmount(portonePayment: Record<string, unknown>, fallbackAmount: number) {
  const cancellations = Array.isArray(portonePayment.cancellations)
    ? portonePayment.cancellations
    : [];

  const succeededAmount = cancellations.reduce((sum, cancellation) => {
    if (!cancellation || typeof cancellation !== "object") return sum;

    const status = "status" in cancellation ? cancellation.status : null;
    const totalAmount = "totalAmount" in cancellation ? cancellation.totalAmount : null;

    if (
      (status === "SUCCEEDED" || status === "REQUESTED") &&
      typeof totalAmount === "number" &&
      Number.isFinite(totalAmount)
    ) {
      return sum + totalAmount;
    }

    return sum;
  }, 0);

  if (succeededAmount > 0) {
    return Math.min(succeededAmount, fallbackAmount);
  }

  return fallbackAmount;
}

async function applyCancelledCreditTopup(
  admin: ReturnType<typeof createAdminClient>,
  payment: StoredPaymentRow,
  remoteStatus: (typeof PORTONE_CANCELLED_STATUSES)[number],
  portonePayment: Record<string, unknown>,
): Promise<PortOneFinalizeResult> {
  if (remoteStatus === "PARTIAL_CANCELLED") {
    await admin
      .from("toss_payments")
      .update({
        status: remoteStatus,
        metadata: {
          ...(payment.metadata || {}),
          provider: "portone",
          pgProvider: "tosspay",
          paymentId: payment.payment_key,
          portoneStatus: remoteStatus,
          manualReviewRequired: true,
          cancelledAmount: getCancelledAmount(portonePayment, payment.amount),
          cancelledAt:
            ("cancelledAt" in portonePayment && typeof portonePayment.cancelledAt === "string"
              ? portonePayment.cancelledAt
              : new Date().toISOString()),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", payment.payment_key);

    return {
      success: false,
      status: remoteStatus,
      error: "Partial cancellation needs manual review.",
    };
  }

  const { data: lockRows, error: lockError } = await admin
    .from("toss_payments")
    .update({
      status: "CANCELLATION_PROCESSING",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", payment.payment_key)
    .eq("status", payment.status)
    .select("order_id");

  if (lockError || !lockRows?.length) {
    return {
      success: false,
      pending: true,
      status: payment.status,
      error: "Cancellation is already being processed.",
    };
  }

  const grantedCredits = Math.max(0, getStoredGrantedCredits(payment));
  const cancelledAmount = getCancelledAmount(portonePayment, payment.amount);
  const creditsToRevoke = grantedCredits;

  const currentPlan = await loadCreditPlanSnapshot(admin, payment.user_id);
  const currentSubscriptionCredits = currentPlan?.subscriptionCredits || 0;
  const currentPurchasedCredits = currentPlan?.purchasedCredits || 0;
  const revokedPurchasedCredits = Math.min(currentPurchasedCredits, creditsToRevoke);
  const remainingAfterPurchased = Math.max(0, creditsToRevoke - revokedPurchasedCredits);
  const revokedSubscriptionCredits = Math.min(currentSubscriptionCredits, remainingAfterPurchased);
  const remainingShortfall = Math.max(
    0,
    creditsToRevoke - revokedPurchasedCredits - revokedSubscriptionCredits,
  );

  const updateResult = await updateCreditPlanBalances(admin, {
    userId: payment.user_id,
    current: currentPlan,
    subscriptionCredits: currentSubscriptionCredits - revokedSubscriptionCredits,
    purchasedCredits: currentPurchasedCredits - revokedPurchasedCredits,
    planType: currentPlan?.planType || "free",
    expiresAt: currentPlan?.expiresAt ?? null,
  });

  if (!updateResult.success) {
    await admin
      .from("toss_payments")
      .update({
        status: "CANCELLATION_FAILED",
        metadata: {
          ...(payment.metadata || {}),
          provider: "portone",
          pgProvider: "tosspay",
          paymentId: payment.payment_key,
          portoneStatus: remoteStatus,
          manualReviewRequired: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", payment.payment_key);

    return { success: false, error: "?щ젅??痍⑥냼 諛섏쁺???ㅽ뙣?덉뒿?덈떎." };
  }

  const totalRevokedCredits = revokedPurchasedCredits + revokedSubscriptionCredits;

  if (totalRevokedCredits > 0) {
    await recordCreditTransaction({
      userId: payment.user_id,
      type: "manual_deduct",
      amount: -totalRevokedCredits,
      balanceAfter: updateResult.plan.credits,
      description: `payment cancelled: credit topup (${totalRevokedCredits}cr)`,
      referenceId: payment.order_id,
      metadata: {
        provider: "portone",
        pgProvider: "tosspay",
        paymentKind: "credit_topup",
        paymentId: payment.payment_key,
        fullCreditRevoke: true,
        cancelledAmount,
        cancelledStatus: remoteStatus,
        revokedPurchasedCredits,
        revokedSubscriptionCredits,
        remainingShortfall,
      },
    });
  }

  await admin
    .from("toss_payments")
    .update({
      status: remoteStatus,
      metadata: {
        ...(payment.metadata || {}),
        provider: "portone",
        pgProvider: "tosspay",
        paymentId: payment.payment_key,
        portoneStatus: remoteStatus,
        cancelledAmount,
        revokedCredits: totalRevokedCredits,
        revokedPurchasedCredits,
        revokedSubscriptionCredits,
        remainingShortfall,
        cancelledAt:
          ("cancelledAt" in portonePayment && typeof portonePayment.cancelledAt === "string"
            ? portonePayment.cancelledAt
            : new Date().toISOString()),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", payment.payment_key);

  return {
    success: false,
    status: remoteStatus,
    error: "Payment cancellation has been applied.",
  };
}

async function applyCancelledInitialProgram(
  admin: ReturnType<typeof createAdminClient>,
  payment: StoredPaymentRow,
  remoteStatus: (typeof PORTONE_CANCELLED_STATUSES)[number],
  portonePayment: Record<string, unknown>,
): Promise<PortOneFinalizeResult> {
  const { data: lockRows, error: lockError } = await admin
    .from("toss_payments")
    .update({
      status: "CANCELLATION_PROCESSING",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", payment.payment_key)
    .eq("status", payment.status)
    .select("order_id");

  if (lockError || !lockRows?.length) {
    return {
      success: false,
      pending: true,
      status: payment.status,
      error: "Cancellation is already being processed.",
    };
  }

  const currentPlan = await loadCreditPlanSnapshot(admin, payment.user_id);
  const cancelledAmount = getCancelledAmount(portonePayment, payment.amount);
  const revokedSubscriptionCredits = currentPlan?.subscriptionCredits || 0;
  const purchasedCredits = currentPlan?.purchasedCredits || 0;
  const grantedPurchasedCredits = getStoredPurchasedGrantedCredits(payment);
  const revokedPurchasedCredits = Math.min(purchasedCredits, grantedPurchasedCredits);
  const remainingShortfall = Math.max(0, grantedPurchasedCredits - revokedPurchasedCredits);

  const updateResult = await updateCreditPlanBalances(admin, {
    userId: payment.user_id,
    current: currentPlan,
    subscriptionCredits: 0,
    purchasedCredits: purchasedCredits - revokedPurchasedCredits,
    planType: "free",
    expiresAt: null,
    extra: {
      monthly_credit_amount: 0,
      monthly_credit_total_cycles: null,
      monthly_credit_granted_cycles: 0,
      next_credit_at: null,
    },
  });

  if (!updateResult.success) {
    await admin
      .from("toss_payments")
      .update({
        status: "CANCELLATION_FAILED",
        metadata: {
          ...(payment.metadata || {}),
          provider: "portone",
          pgProvider: "tosspay",
          paymentId: payment.payment_key,
          portoneStatus: remoteStatus,
          manualReviewRequired: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", payment.payment_key);

    return { success: false, error: "?ъ씤???쒗븳 ?뚰쉶???ㅽ뙣?덉뒿?덈떎." };
  }

  const totalRevokedCredits = revokedSubscriptionCredits + revokedPurchasedCredits;

  if (totalRevokedCredits > 0) {
    await recordCreditTransaction({
      userId: payment.user_id,
      type: "manual_deduct",
      amount: -totalRevokedCredits,
      balanceAfter: updateResult.plan.credits,
      description: `payment cancelled: initial program (${totalRevokedCredits}cr)`,
      referenceId: payment.order_id,
      metadata: {
        provider: "portone",
        pgProvider: "tosspay",
        paymentKind: "initial_program",
        paymentId: payment.payment_key,
        cancelledStatus: remoteStatus,
        revokedSubscriptionCredits,
        revokedPurchasedCredits,
        remainingShortfall,
      },
    });
  }

  await admin
    .from("toss_payments")
    .update({
      status: remoteStatus,
      metadata: {
        ...(payment.metadata || {}),
        provider: "portone",
        pgProvider: "tosspay",
        paymentId: payment.payment_key,
        portoneStatus: remoteStatus,
        cancelledAmount,
        revokedSubscriptionCredits,
        revokedPurchasedCredits,
        remainingShortfall,
        cancelledAt:
          ("cancelledAt" in portonePayment && typeof portonePayment.cancelledAt === "string"
            ? portonePayment.cancelledAt
            : new Date().toISOString()),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", payment.payment_key);

  return {
    success: false,
    status: remoteStatus,
    error: "Payment cancellation has been applied.",
  };
}

export async function finalizePortOnePayment(
  paymentId: string,
  options?: PortOneFinalizeOptions,
): Promise<PortOneFinalizeResult> {
  const { admin, payment, error } = await readStoredPayment(paymentId);

  if (error) {
    console.error("[PortOne] Failed to load payment row:", error);
    return { success: false, error: "결제 주문을 확인하지 못했습니다." };
  }

  if (!payment) {
    return { success: false, error: "결제 주문을 찾을 수 없습니다." };
  }

  if (options?.userId && payment.user_id !== options.userId) {
    return { success: false, error: "해당 결제에 접근할 수 없습니다." };
  }

  if (PORTONE_CANCELLED_STATUSES.includes(payment.status as (typeof PORTONE_CANCELLED_STATUSES)[number])) {
    return {
      success: false,
      status: payment.status,
      error: "Payment has already been cancelled.",
    };
  }

  if (payment.status === "DONE" && !options?.forceRefresh) {
    return buildCompletedResult(admin, payment);
  }

  if (payment.status === "PROCESSING" || payment.status === "CANCELLATION_PROCESSING") {
    return {
      success: false,
      pending: true,
      status: payment.status,
      error: "결제 완료를 반영하는 중입니다.",
    };
  }

  let portonePayment;

  try {
    portonePayment = await getPaymentClient().getPayment({ paymentId });
  } catch (portoneError) {
    console.error("[PortOne] getPayment failed:", portoneError);
    return { success: false, error: "포트원 결제 정보를 조회하지 못했습니다." };
  }

  if (!portonePayment || typeof portonePayment !== "object") {
    return { success: false, error: "포트원 결제 응답이 올바르지 않습니다." };
  }

  const remoteStatus =
    "status" in portonePayment && typeof portonePayment.status === "string"
      ? portonePayment.status
      : "UNKNOWN";

  if (remoteStatus === "CANCELLED" || remoteStatus === "PARTIAL_CANCELLED") {
    const typedPortonePayment = portonePayment as Record<string, unknown>;
    const paymentKind =
      typeof payment.metadata?.paymentKind === "string" ? payment.metadata.paymentKind : null;

    if (paymentKind === "credit_topup") {
      return applyCancelledCreditTopup(admin, payment, remoteStatus, typedPortonePayment);
    }

    return applyCancelledInitialProgram(admin, payment, remoteStatus, typedPortonePayment);
  }

  if (remoteStatus !== "PAID") {
    const nextMetadata = {
      ...(payment.metadata || {}),
      provider: "portone",
      pgProvider: "tosspay",
      paymentId,
      portoneStatus: remoteStatus,
      ...(remoteStatus === "FAILED" && "failure" in portonePayment
        ? { failure: portonePayment.failure }
        : {}),
    };

    await admin
      .from("toss_payments")
      .update({
        status: remoteStatus,
        metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", paymentId);

    if (remoteStatus === "FAILED") {
      return {
        success: false,
        error:
          ("failure" in portonePayment &&
            ((typeof portonePayment.failure?.reason === "string" &&
              portonePayment.failure.reason) ||
              (typeof portonePayment.failure?.pgMessage === "string" &&
                portonePayment.failure.pgMessage))) ||
          "결제가 실패했습니다.",
      };
    }

    return {
      success: false,
      pending: true,
      status: remoteStatus,
      error: "결제 완료를 기다리는 중입니다.",
    };
  }

  const remoteAmount =
    "amount" in portonePayment &&
    typeof portonePayment.amount === "object" &&
    portonePayment.amount &&
    typeof portonePayment.amount.total === "number"
      ? portonePayment.amount.total
      : null;

  if (remoteAmount === null || remoteAmount !== payment.amount) {
    await admin
      .from("toss_payments")
      .update({
        status: "AMOUNT_MISMATCH",
        metadata: {
          ...(payment.metadata || {}),
          provider: "portone",
          pgProvider: "tosspay",
          paymentId,
          portoneStatus: remoteStatus,
          remoteAmount,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", paymentId);

    return { success: false, error: "결제 금액이 주문 정보와 일치하지 않습니다." };
  }

  const { data: processingRows, error: processingError } = await admin
    .from("toss_payments")
    .update({
      status: "PROCESSING",
      metadata: {
        ...(payment.metadata || {}),
        provider: "portone",
        pgProvider: "tosspay",
        paymentId,
        portoneStatus: remoteStatus,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", paymentId)
    .in("status", [...PORTONE_LOCKABLE_STATUSES])
    .select("order_id");

  if (processingError) {
    console.error("[PortOne] Failed to acquire processing lock:", processingError);
    return { success: false, error: "결제 처리 상태를 갱신하지 못했습니다." };
  }

  if (!processingRows?.length) {
    const reloaded = await readStoredPayment(paymentId);

    if (reloaded.payment?.status === "DONE") {
      return buildCompletedResult(reloaded.admin, reloaded.payment);
    }

    return {
      success: false,
      pending: true,
      status: reloaded.payment?.status || remoteStatus,
      error: "이미 처리 중이거나 완료된 결제입니다.",
    };
  }

  const paymentKind =
    typeof payment.metadata?.paymentKind === "string" ? payment.metadata.paymentKind : null;

  if (paymentKind === "credit_topup") {
    const grantedCredits = getStoredGrantedTotalCredits(payment.metadata, payment.credits ?? 0);

    const currentPlan = await loadCreditPlanSnapshot(admin, payment.user_id);
    const updateResult = await updateCreditPlanBalances(admin, {
      userId: payment.user_id,
      current: currentPlan,
      subscriptionCredits: currentPlan?.subscriptionCredits || 0,
      purchasedCredits: (currentPlan?.purchasedCredits || 0) + grantedCredits,
      planType: currentPlan?.planType || "free",
      expiresAt: currentPlan?.expiresAt ?? null,
    });

    if (!updateResult.success) {
      console.error("[PortOne] Credit topup grant failed:", updateResult.error);

      await admin
        .from("toss_payments")
        .update({
          status: "CREDIT_GRANT_FAILED",
          metadata: {
            ...(payment.metadata || {}),
            provider: "portone",
            pgProvider: "tosspay",
            paymentId,
            portoneStatus: remoteStatus,
            grantedCredits,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("payment_key", paymentId);

      return {
        success: false,
        error: "크레딧 충전 반영 중 충돌이 발생했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    await admin
      .from("toss_payments")
      .update({
        status: "DONE",
        credits: grantedCredits,
        metadata: {
          ...(payment.metadata || {}),
          provider: "portone",
          pgProvider: "tosspay",
          paymentId,
          portoneStatus: remoteStatus,
          confirmedAt: new Date().toISOString(),
          packCredits: grantedCredits,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", paymentId);

    await recordCreditTransaction({
      userId: payment.user_id,
      type: "charge",
      amount: grantedCredits,
      balanceAfter: updateResult.plan.credits,
      description: `portone payment charge (${grantedCredits}cr)`,
      referenceId: payment.order_id,
      metadata: {
        provider: "portone",
        pgProvider: "tosspay",
        paymentKind: "credit_topup",
        paymentId,
        amount: payment.amount,
        credits: grantedCredits,
        purchasedGranted: grantedCredits,
        subscriptionGranted: 0,
      },
    });

    return {
      success: true,
      paymentKind: "credit_topup",
      added: grantedCredits,
      credits: updateResult.plan.credits,
      orderName: payment.order_name || `FlowSpot 크레딧 ${grantedCredits}cr`,
      message: `${grantedCredits}cr 충전이 완료되었습니다. (보유: ${updateResult.plan.credits}cr)`,
    };
  }

  const planType =
    typeof payment.metadata?.planType === "string" ? payment.metadata.planType : "allinone";
  const config = TOSSPAY_PLAN_CONFIG[planType as keyof typeof TOSSPAY_PLAN_CONFIG];
  const subscriptionGrantedCredits = getSnapshotGrantedSubscriptionCredits(
    payment.metadata,
    config?.initialCredits ?? 0,
  );
  const purchasedBonusCredits = getStoredPurchasedGrantedCredits(payment);

  if (!config) {
    await admin
      .from("toss_payments")
      .update({
        status: "UNKNOWN_PLAN",
        metadata: {
          ...(payment.metadata || {}),
          provider: "portone",
          pgProvider: "tosspay",
          paymentId,
          portoneStatus: remoteStatus,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", paymentId);

    return { success: false, error: "알 수 없는 결제 상품입니다." };
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + config.months);
  const immediateGrantedCredits = subscriptionGrantedCredits + purchasedBonusCredits;

  const nextCreditAt = new Date();
  nextCreditAt.setMonth(nextCreditAt.getMonth() + 1);

  const planGrantResult = await applyInitialProgramPlan(
    admin,
    payment.user_id,
    config,
    subscriptionGrantedCredits,
    expiresAt.toISOString(),
    nextCreditAt.toISOString(),
    purchasedBonusCredits,
  );

  if (!planGrantResult.success) {
    console.error("[PortOne] Initial program plan grant failed:", planGrantResult.error);

    if (isLegacySchemaError(planGrantResult.error)) {
      const legacyGrantResult = await applyLegacyProgramCreditsOnly(
        admin,
        payment.user_id,
        immediateGrantedCredits,
      );

      if (legacyGrantResult.success) {
        await admin
          .from("toss_payments")
          .update({
            status: "DONE",
            credits: immediateGrantedCredits,
            metadata: {
              ...(payment.metadata || {}),
              provider: "portone",
              pgProvider: "tosspay",
              paymentId,
              portoneStatus: remoteStatus,
              fallbackMode: "legacy_schema",
              userPlanType: config.userPlanType,
              paymentKind: config.paymentKind,
              initialCredits: subscriptionGrantedCredits,
              grantedSubscriptionCredits: subscriptionGrantedCredits,
              grantedPurchasedCredits: purchasedBonusCredits,
              grantedTotalCredits: immediateGrantedCredits,
              earlybirdBonusCredits: purchasedBonusCredits,
              monthlyCredits: config.monthlyCredits,
              months: config.months,
              accessExpiresAt: expiresAt.toISOString(),
              purchasedGranted: purchasedBonusCredits,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("payment_key", paymentId);

        await recordCreditTransaction({
          userId: payment.user_id,
          type: "charge",
          amount: immediateGrantedCredits,
          balanceAfter: legacyGrantResult.credits,
          description: `initial program payment (legacy fallback): ${config.name}`,
          referenceId: payment.order_id,
          metadata: {
            provider: "portone",
            pgProvider: "tosspay",
            planType,
            userPlanType: config.userPlanType,
            paymentKind: config.paymentKind,
            paymentId,
            amount: payment.amount,
            initialCredits: subscriptionGrantedCredits,
            monthlyCredits: config.monthlyCredits,
            subscriptionGranted: subscriptionGrantedCredits,
            purchasedGranted: purchasedBonusCredits,
            grantedSubscriptionCredits: subscriptionGrantedCredits,
            grantedPurchasedCredits: purchasedBonusCredits,
            grantedTotalCredits: immediateGrantedCredits,
            earlybirdBonusCredits: purchasedBonusCredits,
            fallbackMode: "legacy_schema",
          },
        });

        await notifyPaymentCompleteByEmail(admin, payment, immediateGrantedCredits);
        await notifyPaymentCompleteByTelegram(admin, payment, immediateGrantedCredits);

        return {
          success: true,
          paymentKind: "initial_program",
          added: immediateGrantedCredits,
          credits: legacyGrantResult.credits,
          orderName: payment.order_name || `FlowSpot ${config.name}`,
          message: `${config.name} 결제가 완료되었습니다.`,
        };
      }

      console.error("[PortOne] Legacy program grant fallback failed:", legacyGrantResult.error);
    }

    await admin
      .from("toss_payments")
      .update({
        status: "CREDIT_GRANT_FAILED",
        credits: immediateGrantedCredits,
        metadata: {
          ...(payment.metadata || {}),
          provider: "portone",
          pgProvider: "tosspay",
          paymentId,
          portoneStatus: remoteStatus,
          userPlanType: config.userPlanType,
          paymentKind: config.paymentKind,
          initialCredits: subscriptionGrantedCredits,
          grantedSubscriptionCredits: subscriptionGrantedCredits,
          grantedPurchasedCredits: purchasedBonusCredits,
          grantedTotalCredits: immediateGrantedCredits,
          earlybirdBonusCredits: purchasedBonusCredits,
          monthlyCredits: config.monthlyCredits,
          months: config.months,
          purchasedGranted: purchasedBonusCredits,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", paymentId);

    return { success: false, error: "올인원 혜택 반영에 실패했습니다." };
  }

  await admin
    .from("toss_payments")
    .update({
      status: "DONE",
      credits: immediateGrantedCredits,
      metadata: {
        ...(payment.metadata || {}),
        provider: "portone",
        pgProvider: "tosspay",
        paymentId,
        portoneStatus: remoteStatus,
        userPlanType: config.userPlanType,
        paymentKind: config.paymentKind,
        initialCredits: config.initialCredits,
        earlybirdBonusCredits: purchasedBonusCredits,
        monthlyCredits: config.monthlyCredits,
        months: config.months,
        purchasedGranted: purchasedBonusCredits,
        confirmedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", paymentId);

  await recordCreditTransaction({
    userId: payment.user_id,
    type: "charge",
    amount: immediateGrantedCredits,
    balanceAfter: planGrantResult.credits,
    description: `initial program payment: ${config.name}`,
    referenceId: payment.order_id,
    metadata: {
      provider: "portone",
      pgProvider: "tosspay",
      planType,
      userPlanType: config.userPlanType,
      paymentKind: config.paymentKind,
      paymentId,
      amount: payment.amount,
      initialCredits: subscriptionGrantedCredits,
      monthlyCredits: config.monthlyCredits,
      subscriptionGranted: subscriptionGrantedCredits,
      purchasedGranted: purchasedBonusCredits,
      grantedSubscriptionCredits: subscriptionGrantedCredits,
      grantedPurchasedCredits: purchasedBonusCredits,
      grantedTotalCredits: immediateGrantedCredits,
      earlybirdBonusCredits: purchasedBonusCredits,
    },
  });

  await notifyPaymentCompleteByEmail(admin, payment, immediateGrantedCredits);
  await notifyPaymentCompleteByTelegram(admin, payment, immediateGrantedCredits);

  return {
    success: true,
    paymentKind: "initial_program",
    added: immediateGrantedCredits,
    credits: planGrantResult.credits,
    orderName: payment.order_name || `FlowSpot ${config.name}`,
    message: `${config.name} 결제가 완료되었습니다.`,
  };
}
