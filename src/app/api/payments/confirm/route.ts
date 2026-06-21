import { NextRequest, NextResponse } from "next/server";

import {
  loadCreditPlanSnapshot,
  recordCreditTransaction,
  updateCreditPlanBalances,
} from "@/lib/credits/server";
import {
  getStoredGrantedPurchasedCredits,
  getStoredGrantedSubscriptionCredits,
  getStoredGrantedTotalCredits,
} from "@/lib/payments/grant-snapshot";
import { finalizePortOnePayment } from "@/lib/payments/portone";
import { CREDIT_TOPUP_PACKS } from "@/lib/plans/config";
import { notifyTelegramPaymentCompleted } from "@/lib/telegram/payments";
import { TOSSPAY_PLAN_CONFIG } from "@/lib/tosspay/config";
import { sendPaymentCompleteEmail } from "@/services/email/actions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const CONFIRMABLE_PAYMENT_STATUSES = [
  "PENDING",
  "PAY_PENDING",
  "IN_PROGRESS",
  "CONFIRM_FAILED",
  "CREDIT_GRANT_FAILED",
];

type PendingPaymentRow = {
  user_id: string;
  order_id: string;
  order_name: string | null;
  amount: number;
  credits: number | null;
  status: string | null;
  payment_key: string | null;
  metadata?: Record<string, unknown> | null;
};

function isLegacySchemaError(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  return code === "42703" || code === "23514";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

async function notifyPaymentCompleteByEmail(
  admin: ReturnType<typeof createAdminClient>,
  payment: PendingPaymentRow,
  grantedCredits: number,
) {
  let buyerEmail = readString(payment.metadata?.buyerEmail) || "";

  if (!buyerEmail) {
    const { data, error } = await admin.auth.admin.getUserById(payment.user_id);
    if (error) {
      console.error("[TossPayments Confirm] Failed to resolve email:", error);
    } else {
      buyerEmail = data.user?.email || "";
    }
  }

  if (!buyerEmail) {
    console.warn("[TossPayments Confirm] Payment complete email skipped: missing_email");
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
      console.error("[TossPayments Confirm] Payment complete email failed:", result.error);
    }
  } catch (error) {
    console.error("[TossPayments Confirm] Payment complete email failed:", error);
  }
}

async function notifyPaymentCompleteByTelegram(
  admin: ReturnType<typeof createAdminClient>,
  payment: PendingPaymentRow,
  grantedCredits: number,
  paymentKey: string,
) {
  let buyerEmail = readString(payment.metadata?.buyerEmail) || "";
  let buyerName = "";

  const { data, error } = await admin.auth.admin.getUserById(payment.user_id);
  if (error) {
    console.error("[TossPayments Confirm] Failed to resolve profile for telegram:", error);
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
    orderId: payment.order_id,
    orderName: payment.order_name || "FlowSpot 결제",
    paymentKind: readString(payment.metadata?.paymentKind),
    provider: "tosspayments",
    paymentId: paymentKey,
    planType: readString(payment.metadata?.planType),
    paidAt: new Date().toISOString(),
  });
}

async function confirmTossPayment({
  paymentKey,
  orderId,
  amount,
}: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const secretKey = process.env.TOSS_SECRET_KEY?.trim();
  if (!secretKey) {
    return {
      ok: false as const,
      status: 500,
      data: { message: "결제 설정이 없습니다." },
    };
  }

  const encryptedSecretKey = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: encryptedSecretKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function buildCompletedResult(
  admin: ReturnType<typeof createAdminClient>,
  payment: PendingPaymentRow,
) {
  const currentPlan = await loadCreditPlanSnapshot(admin, payment.user_id);
  const paymentKind =
    payment.metadata?.paymentKind === "initial_program" ? "initial_program" : "credit_topup";
  const added = payment.credits ?? getStoredGrantedTotalCredits(payment.metadata, 0);

  return {
    success: true,
    paymentKind,
    credits: currentPlan?.credits ?? 0,
    added,
    orderId: payment.order_id,
    orderName:
      payment.order_name ||
      (paymentKind === "initial_program" ? "FlowSpot 올인원" : "FlowSpot 크레딧 충전"),
    message:
      paymentKind === "initial_program"
        ? "올인원 결제가 완료되었습니다."
        : `${added}cr 충전이 완료되었습니다.`,
  };
}

async function completeCreditTopupPayment(
  admin: ReturnType<typeof createAdminClient>,
  payment: PendingPaymentRow,
  paymentKey: string,
) {
  const pack = CREDIT_TOPUP_PACKS.find((candidate) => candidate.amount === payment.amount);
  if (!pack) {
    await admin
      .from("toss_payments")
      .update({
        status: "INVALID_AMOUNT",
        payment_key: paymentKey,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", payment.order_id)
      .eq("user_id", payment.user_id);

    return NextResponse.json(
      { success: false, error: `유효하지 않은 결제 금액입니다. ${payment.amount}` },
      { status: 400 },
    );
  }

  if ((payment.credits ?? pack.credits) !== pack.credits) {
    return NextResponse.json(
      { success: false, error: "결제 주문 정보가 요청 값과 일치하지 않습니다." },
      { status: 400 },
    );
  }

  const currentPlan = await loadCreditPlanSnapshot(admin, payment.user_id);
  const updateResult = await updateCreditPlanBalances(admin, {
    userId: payment.user_id,
    current: currentPlan,
    subscriptionCredits: currentPlan?.subscriptionCredits || 0,
    purchasedCredits: (currentPlan?.purchasedCredits || 0) + pack.credits,
    planType: currentPlan?.planType || "free",
    expiresAt: currentPlan?.expiresAt ?? null,
  });

  if (!updateResult.success) {
    console.error("[TossPayments Confirm] Credit update failed:", updateResult.error);
    await admin
      .from("toss_payments")
      .update({
        status: "CREDIT_GRANT_FAILED",
        payment_key: paymentKey,
        metadata: {
          ...(payment.metadata || {}),
          provider: "tosspayments",
          paymentKind: "credit_topup",
          paymentKey,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", payment.order_id)
      .eq("user_id", payment.user_id);

    return NextResponse.json(
      {
        success: false,
        error: "크레딧 충전 중 충돌이 발생했습니다. 다시 시도해 주세요.",
      },
      { status: 409 },
    );
  }

  const nextMetadata = {
    ...(payment.metadata || {}),
    provider: "tosspayments",
    pgProvider: "tosspayments",
    paymentKind: "credit_topup",
    paymentKey,
    packCredits: pack.credits,
    confirmedAt: new Date().toISOString(),
  };

  const paymentUpdate = await admin
    .from("toss_payments")
    .update({
      payment_key: paymentKey,
      order_name: payment.order_name || `FlowSpot 크레딧 ${pack.credits}cr`,
      amount: payment.amount,
      credits: pack.credits,
      status: "DONE",
      metadata: nextMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", payment.order_id)
    .eq("user_id", payment.user_id);

  if (paymentUpdate.error) {
    console.error("[TossPayments Confirm] Failed to finalize payment row:", paymentUpdate.error);
    return NextResponse.json(
      { success: false, error: "결제 이력 저장에 실패했습니다. 수동 확인이 필요합니다." },
      { status: 500 },
    );
  }

  await recordCreditTransaction({
    userId: payment.user_id,
    type: "charge",
    amount: pack.credits,
    balanceAfter: updateResult.plan.credits,
    description: `tosspayments charge (${pack.credits}cr)`,
    referenceId: payment.order_id,
    metadata: {
      provider: "tosspayments",
      pgProvider: "tosspayments",
      paymentKind: "credit_topup",
      paymentKey,
      amount: payment.amount,
      credits: pack.credits,
      purchasedGranted: pack.credits,
      subscriptionGranted: 0,
    },
  });

  await notifyPaymentCompleteByTelegram(admin, payment, pack.credits, paymentKey);

  return NextResponse.json({
    success: true,
    paymentKind: "credit_topup",
    credits: updateResult.plan.credits,
    added: pack.credits,
    orderId: payment.order_id,
    orderName: payment.order_name || `FlowSpot 크레딧 ${pack.credits}cr`,
    message: `${pack.credits}cr 충전이 완료되었습니다. (보유: ${updateResult.plan.credits}cr)`,
  });
}

async function completeInitialProgramPayment(
  admin: ReturnType<typeof createAdminClient>,
  payment: PendingPaymentRow,
  paymentKey: string,
) {
  const planType = readString(payment.metadata?.planType) || "allinone";
  const config =
    planType in TOSSPAY_PLAN_CONFIG
      ? TOSSPAY_PLAN_CONFIG[planType as keyof typeof TOSSPAY_PLAN_CONFIG]
      : null;

  if (!config) {
    await admin
      .from("toss_payments")
      .update({
        status: "UNKNOWN_PLAN",
        payment_key: paymentKey,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", payment.order_id)
      .eq("user_id", payment.user_id);

    return NextResponse.json(
      { success: false, error: "알 수 없는 결제 상품입니다." },
      { status: 400 },
    );
  }

  const subscriptionGrantedCredits = getStoredGrantedSubscriptionCredits(
    payment.metadata,
    config.initialCredits,
  );
  const purchasedBonusCredits = getStoredGrantedPurchasedCredits(payment.metadata, 0);
  const immediateGrantedCredits = subscriptionGrantedCredits + purchasedBonusCredits;

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + config.months);

  const nextCreditAt = new Date();
  nextCreditAt.setMonth(nextCreditAt.getMonth() + 1);

  const currentPlan = await loadCreditPlanSnapshot(admin, payment.user_id);
  const updateResult = await updateCreditPlanBalances(admin, {
    userId: payment.user_id,
    current: currentPlan,
    subscriptionCredits: subscriptionGrantedCredits,
    purchasedCredits: (currentPlan?.purchasedCredits || 0) + purchasedBonusCredits,
    planType: config.userPlanType,
    expiresAt: expiresAt.toISOString(),
    extra: {
      monthly_credit_amount: config.monthlyCredits,
      monthly_credit_total_cycles: config.months,
      monthly_credit_granted_cycles: 1,
      next_credit_at: nextCreditAt.toISOString(),
    },
  });

  if (!updateResult.success) {
    console.error("[TossPayments Confirm] Initial program grant failed:", updateResult.error);

    if (isLegacySchemaError(updateResult.error)) {
      const legacyGrantResult = await applyLegacyProgramCreditsOnly(
        admin,
        payment.user_id,
        immediateGrantedCredits,
      );

      if (legacyGrantResult.success) {
        const legacyMetadata = {
          ...(payment.metadata || {}),
          provider: "tosspayments",
          pgProvider: "tosspayments",
          paymentKey,
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
          confirmedAt: new Date().toISOString(),
        };

        await admin
          .from("toss_payments")
          .update({
            status: "DONE",
            payment_key: paymentKey,
            credits: immediateGrantedCredits,
            metadata: legacyMetadata,
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", payment.order_id)
          .eq("user_id", payment.user_id);

        await recordCreditTransaction({
          userId: payment.user_id,
          type: "charge",
          amount: immediateGrantedCredits,
          balanceAfter: legacyGrantResult.credits,
          description: `initial program payment (legacy fallback): ${config.name}`,
          referenceId: payment.order_id,
          metadata: {
            provider: "tosspayments",
            pgProvider: "tosspayments",
            planType,
            userPlanType: config.userPlanType,
            paymentKind: config.paymentKind,
            paymentKey,
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
        await notifyPaymentCompleteByTelegram(admin, payment, immediateGrantedCredits, paymentKey);

        return NextResponse.json({
          success: true,
          paymentKind: "initial_program",
          added: immediateGrantedCredits,
          credits: legacyGrantResult.credits,
          orderId: payment.order_id,
          orderName: payment.order_name || `FlowSpot ${config.name}`,
          message: `${config.name} 결제가 완료되었습니다.`,
        });
      }
    }

    await admin
      .from("toss_payments")
      .update({
        status: "CREDIT_GRANT_FAILED",
        payment_key: paymentKey,
        credits: immediateGrantedCredits,
        metadata: {
          ...(payment.metadata || {}),
          provider: "tosspayments",
          pgProvider: "tosspayments",
          paymentKey,
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
      .eq("order_id", payment.order_id)
      .eq("user_id", payment.user_id);

    return NextResponse.json(
      { success: false, error: "올인원 혜택 반영에 실패했습니다." },
      { status: 409 },
    );
  }

  const nextMetadata = {
    ...(payment.metadata || {}),
    provider: "tosspayments",
    pgProvider: "tosspayments",
    paymentKey,
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
    accessExpiresAt: expiresAt.toISOString(),
    nextCreditAt: nextCreditAt.toISOString(),
    confirmedAt: new Date().toISOString(),
  };

  const paymentUpdate = await admin
    .from("toss_payments")
    .update({
      status: "DONE",
      payment_key: paymentKey,
      credits: immediateGrantedCredits,
      metadata: nextMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", payment.order_id)
    .eq("user_id", payment.user_id);

  if (paymentUpdate.error) {
    console.error("[TossPayments Confirm] Failed to finalize payment row:", paymentUpdate.error);
    return NextResponse.json(
      { success: false, error: "결제 이력 저장에 실패했습니다. 수동 확인이 필요합니다." },
      { status: 500 },
    );
  }

  await recordCreditTransaction({
    userId: payment.user_id,
    type: "charge",
    amount: immediateGrantedCredits,
    balanceAfter: updateResult.plan.credits,
    description: `initial program payment: ${config.name}`,
    referenceId: payment.order_id,
    metadata: {
      provider: "tosspayments",
      pgProvider: "tosspayments",
      planType,
      userPlanType: config.userPlanType,
      paymentKind: config.paymentKind,
      paymentKey,
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
  await notifyPaymentCompleteByTelegram(admin, payment, immediateGrantedCredits, paymentKey);

  return NextResponse.json({
    success: true,
    paymentKind: "initial_program",
    added: immediateGrantedCredits,
    credits: updateResult.plan.credits,
    orderId: payment.order_id,
    orderName: payment.order_name || `FlowSpot ${config.name}`,
    message: `${config.name} 결제가 완료되었습니다.`,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { paymentId, paymentKey, orderId, amount } = body as {
      paymentId?: string;
      paymentKey?: string;
      orderId?: string;
      amount?: number;
    };

    if (paymentId) {
      const result = await finalizePortOnePayment(paymentId, { userId: user.id });

      if (result.success) {
        return NextResponse.json(result);
      }

      if (result.pending) {
        return NextResponse.json(result, { status: 202 });
      }

      return NextResponse.json(result, { status: 400 });
    }

    if (!paymentKey || !orderId || typeof amount !== "number" || !Number.isFinite(amount)) {
      return NextResponse.json(
        { success: false, error: "paymentKey, orderId, amount가 필요합니다." },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
    const { data: pendingPayment, error: pendingPaymentError } = await adminClient
      .from("toss_payments")
      .select("user_id, order_id, order_name, amount, credits, status, payment_key, metadata")
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .single();

    if (pendingPaymentError || !pendingPayment) {
      return NextResponse.json(
        { success: false, error: "결제 주문을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const payment = pendingPayment as PendingPaymentRow;
    const paymentKind =
      typeof payment.metadata?.paymentKind === "string"
        ? payment.metadata.paymentKind
        : "credit_topup";

    if (payment.amount !== amount) {
      await adminClient
        .from("toss_payments")
        .update({
          status: "AMOUNT_MISMATCH",
          payment_key: paymentKey,
          metadata: {
            ...(payment.metadata || {}),
            provider: "tosspayments",
            requestedAmount: amount,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .eq("user_id", user.id);

      return NextResponse.json(
        { success: false, error: "결제 금액이 주문 정보와 일치하지 않습니다." },
        { status: 400 },
      );
    }

    if (payment.status === "DONE") {
      return NextResponse.json(await buildCompletedResult(adminClient, payment));
    }

    if (payment.status === "PROCESSING") {
      return NextResponse.json(
        {
          success: false,
          pending: true,
          status: payment.status,
          error: "결제 완료를 반영하는 중입니다.",
        },
        { status: 202 },
      );
    }

    const { data: processingRows, error: processingError } = await adminClient
      .from("toss_payments")
      .update({
        status: "PROCESSING",
        payment_key: paymentKey,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .in("status", CONFIRMABLE_PAYMENT_STATUSES)
      .select("order_id");

    if (processingError) {
      console.error("[TossPayments Confirm] Failed to acquire processing lock:", processingError);
      return NextResponse.json(
        { success: false, error: "결제 처리 상태를 확보하지 못했습니다." },
        { status: 409 },
      );
    }

    if (!processingRows?.length) {
      const { data: reloadedPayment } = await adminClient
        .from("toss_payments")
        .select("user_id, order_id, order_name, amount, credits, status, payment_key, metadata")
        .eq("order_id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();

      if ((reloadedPayment as PendingPaymentRow | null)?.status === "DONE") {
        return NextResponse.json(
          await buildCompletedResult(adminClient, reloadedPayment as PendingPaymentRow),
        );
      }

      return NextResponse.json(
        {
          success: false,
          pending: true,
          status: (reloadedPayment as PendingPaymentRow | null)?.status || payment.status,
          error: "이미 처리 중이거나 완료된 결제입니다.",
        },
        { status: 202 },
      );
    }

    const confirmResult = await confirmTossPayment({
      paymentKey,
      orderId,
      amount: payment.amount,
    });

    if (!confirmResult.ok) {
      console.error("[TossPayments Confirm] Toss confirm failed:", confirmResult.data);
      await adminClient
        .from("toss_payments")
        .update({
          status: "CONFIRM_FAILED",
          payment_key: paymentKey,
          metadata: {
            ...(payment.metadata || {}),
            provider: "tosspayments",
            paymentKind,
            confirmError: confirmResult.data,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          success: false,
          error:
            readString(confirmResult.data.message) ||
            "결제 확인에 실패했습니다.",
        },
        { status: confirmResult.status >= 500 ? 500 : 400 },
      );
    }

    const remoteStatus = readString(confirmResult.data.status) || "DONE";
    if (remoteStatus !== "DONE") {
      await adminClient
        .from("toss_payments")
        .update({
          status: remoteStatus,
          payment_key: paymentKey,
          metadata: {
            ...(payment.metadata || {}),
            provider: "tosspayments",
            paymentKind,
            remoteStatus,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          success: false,
          pending: true,
          status: remoteStatus,
          error: "결제 완료를 기다리는 중입니다.",
        },
        { status: 202 },
      );
    }

    if (paymentKind === "initial_program") {
      return completeInitialProgramPayment(adminClient, payment, paymentKey);
    }

    if (paymentKind === "credit_topup") {
      return completeCreditTopupPayment(adminClient, payment, paymentKey);
    }

    await adminClient
      .from("toss_payments")
      .update({
        status: "UNKNOWN_PAYMENT_KIND",
        payment_key: paymentKey,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("user_id", user.id);

    return NextResponse.json(
      { success: false, error: "유효하지 않은 결제 주문입니다." },
      { status: 400 },
    );
  } catch (error) {
    console.error("[Payments Confirm] Error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
