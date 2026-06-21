import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PaymentClient } from "@portone/server-sdk";

import {
  loadCreditPlanSnapshot,
  recordCreditTransaction,
  updateCreditPlanBalances,
} from "@/lib/credits/server";
import { evaluateAdminRefund, type AdminRefundPreview } from "@/lib/payments/refund-policy";
import { finalizePortOnePayment } from "@/lib/payments/portone";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || "";
const APPLIED_CANCEL_STATUSES = new Set(["CANCELLED", "PARTIAL_CANCELLED"]);
const TOSS_PAYMENTS_CANCEL_URL = "https://api.tosspayments.com/v1/payments";

type RefundPaymentRow = {
  user_id: string;
  order_id: string;
  order_name: string | null;
  amount: number;
  payment_key: string | null;
  metadata?: Record<string, unknown> | null;
};

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",")
      .map((email) => email.trim())
      .filter(Boolean) || [];

  if (!adminEmails.includes(user.email)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}

function getProvider(metadata: Record<string, unknown> | null | undefined) {
  return typeof metadata?.provider === "string" ? metadata.provider : "";
}

async function requestTossPaymentsCancel({
  paymentKey,
  preview,
  reason,
  idempotencyKey,
}: {
  paymentKey: string;
  preview: AdminRefundPreview;
  reason: string;
  idempotencyKey: string;
}) {
  const secretKey = process.env.TOSS_SECRET_KEY?.trim() || "";
  if (!secretKey) {
    return {
      ok: false as const,
      status: 500,
      data: { message: "TOSS_SECRET_KEY is not configured" },
    };
  }

  const authorization = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
  const body: Record<string, unknown> = {
    cancelReason: reason.slice(0, 200),
  };

  if (preview.requiresPartialCancel) {
    body.cancelAmount = preview.refundAmount;
  }

  const response = await fetch(
    `${TOSS_PAYMENTS_CANCEL_URL}/${encodeURIComponent(paymentKey)}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function applyTossPaymentsRefund({
  admin,
  adminEmail,
  payment,
  preview,
  reason,
  cancelResponse,
  idempotencyKey,
}: {
  admin: ReturnType<typeof createAdminClient>;
  adminEmail: string;
  payment: RefundPaymentRow;
  preview: AdminRefundPreview;
  reason: string;
  cancelResponse: Record<string, unknown>;
  idempotencyKey: string;
}) {
  const paymentKey = payment.payment_key || "";
  const refundAmount = preview.refundAmount;
  const isFullRefund = preview.refundType === "full";

  const { data: lockRows } = await admin
    .from("toss_payments")
    .update({
      status: "CANCELLATION_PROCESSING",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", paymentKey)
    .eq("status", "DONE")
    .select("order_id");

  if (!lockRows?.length) {
    return NextResponse.json(
      { error: "결제 상태가 이미 변경되어 취소 반영에 실패했습니다." },
      { status: 409 },
    );
  }

  let revokedSubscriptionCredits = 0;
  let revokedPurchasedCredits = 0;
  let remainingShortfall = 0;
  let revokeError: unknown = null;

  if (isFullRefund) {
    const currentPlan = await loadCreditPlanSnapshot(admin, payment.user_id);
    const currentSubscriptionCredits = currentPlan?.subscriptionCredits || 0;
    const currentPurchasedCredits = currentPlan?.purchasedCredits || 0;

    if (preview.revokeScope === "plan_and_credits") {
      revokedSubscriptionCredits = currentSubscriptionCredits;
      revokedPurchasedCredits = Math.min(
        currentPurchasedCredits,
        preview.grantedPurchasedCredits,
      );
      remainingShortfall = Math.max(
        0,
        preview.grantedPurchasedCredits - revokedPurchasedCredits,
      );

      const updateResult = await updateCreditPlanBalances(admin, {
        userId: payment.user_id,
        current: currentPlan,
        subscriptionCredits: 0,
        purchasedCredits: currentPurchasedCredits - revokedPurchasedCredits,
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
        revokeError = updateResult;
      } else {
        const totalRevoked = revokedSubscriptionCredits + revokedPurchasedCredits;
        if (totalRevoked > 0) {
          await recordCreditTransaction({
            userId: payment.user_id,
            type: "manual_deduct",
            amount: -totalRevoked,
            balanceAfter: updateResult.plan.credits,
            description: `tosspayments cancelled: initial program (${totalRevoked}cr)`,
            referenceId: payment.order_id,
            eventType: "refund",
            action: "tosspayments_initial_program_cancel",
            subscriptionCreditsDelta: -revokedSubscriptionCredits,
            purchasedCreditsDelta: -revokedPurchasedCredits,
            subscriptionCreditsBalance: updateResult.plan.subscriptionCredits,
            purchasedCreditsBalance: updateResult.plan.purchasedCredits,
            metadata: {
              provider: "tosspayments",
              paymentKind: "initial_program",
              paymentKey,
              idempotencyKey,
              revokedSubscriptionCredits,
              revokedPurchasedCredits,
              remainingShortfall,
              refundAmount,
            },
          });
        }
      }
    } else {
      const granted = preview.grantedPurchasedCredits;
      revokedPurchasedCredits = Math.min(currentPurchasedCredits, granted);
      const afterPurchased = granted - revokedPurchasedCredits;
      revokedSubscriptionCredits = Math.min(currentSubscriptionCredits, afterPurchased);
      remainingShortfall = Math.max(
        0,
        granted - revokedPurchasedCredits - revokedSubscriptionCredits,
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
        revokeError = updateResult;
      } else {
        const totalRevoked = revokedSubscriptionCredits + revokedPurchasedCredits;
        if (totalRevoked > 0) {
          await recordCreditTransaction({
            userId: payment.user_id,
            type: "manual_deduct",
            amount: -totalRevoked,
            balanceAfter: updateResult.plan.credits,
            description: `tosspayments cancelled: credit topup (${totalRevoked}cr)`,
            referenceId: payment.order_id,
            eventType: "refund",
            action: "tosspayments_credit_topup_cancel",
            subscriptionCreditsDelta: -revokedSubscriptionCredits,
            purchasedCreditsDelta: -revokedPurchasedCredits,
            subscriptionCreditsBalance: updateResult.plan.subscriptionCredits,
            purchasedCreditsBalance: updateResult.plan.purchasedCredits,
            metadata: {
              provider: "tosspayments",
              paymentKind: "credit_topup",
              paymentKey,
              idempotencyKey,
              revokedSubscriptionCredits,
              revokedPurchasedCredits,
              remainingShortfall,
              refundAmount,
            },
          });
        }
      }
    }
  }

  if (revokeError) {
    console.error("[Admin Cancel] TossPayments revoke failed:", revokeError);
    await admin
      .from("toss_payments")
      .update({
        status: "CANCELLATION_FAILED",
        metadata: {
          ...(payment.metadata || {}),
          manualReviewRequired: true,
          tossPaymentsCancelResponse: cancelResponse,
          idempotencyKey,
          refundAmount,
          refundedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", paymentKey);

    return NextResponse.json(
      { error: "환불은 접수되었으나 이용권/크레딧 회수에 실패했습니다. 관리자 확인 필요." },
      { status: 500 },
    );
  }

  const finalStatus = isFullRefund ? "CANCELLED" : "PARTIAL_CANCELLED";

  await admin
    .from("toss_payments")
    .update({
      status: finalStatus,
      metadata: {
        ...(payment.metadata || {}),
        tossPaymentsCancelResponse: cancelResponse,
        idempotencyKey,
        refundAmount,
        refundReason: reason,
        refundedAt: new Date().toISOString(),
        revokedSubscriptionCredits,
        revokedPurchasedCredits,
        remainingShortfall,
        cancelledAmount: refundAmount,
        manualReviewRequired: !isFullRefund ? true : undefined,
        adminCancel: {
          at: new Date().toISOString(),
          by: adminEmail,
          reason,
          requestedRefundAmount: preview.refundAmount,
          paymentAmount: preview.paymentAmount,
          refundType: preview.refundType,
          revokeScope: preview.revokeScope,
          elapsedDays: preview.elapsedDays,
          lectureCount: preview.lectureCount,
          creditsUsed: preview.creditsUsed,
          materialDownloadTracked: preview.materialDownloadTracked,
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", paymentKey);

  return NextResponse.json({
    success: true,
    paymentKey,
    refundAmount,
    status: finalStatus,
    preview,
    revokedSubscriptionCredits,
    revokedPurchasedCredits,
    remainingShortfall,
    message: isFullRefund
      ? preview.revokeScope === "plan_and_credits"
        ? "규정에 따른 전액 환불이 처리되었고, 이용권과 크레딧이 회수되었습니다."
        : "전액 환불이 처리되었고, 해당 크레딧이 회수되었습니다."
      : "규정에 따른 부분 환불이 처리되었습니다. 크레딧/플랜 조정은 수동 확인이 필요합니다.",
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paymentKey: string }> },
) {
  const adminCheck = await requireAdminUser();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { paymentKey } = await params;
  if (!paymentKey) {
    return NextResponse.json({ error: "paymentKey is required" }, { status: 400 });
  }

  const evaluation = await evaluateAdminRefund(paymentKey);
  if (!evaluation.ok) {
    return NextResponse.json({ error: evaluation.error }, { status: evaluation.status });
  }

  return NextResponse.json({
    success: true,
    preview: evaluation.preview,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentKey: string }> },
) {
  const adminCheck = await requireAdminUser();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { paymentKey } = await params;
  if (!paymentKey) {
    return NextResponse.json({ error: "paymentKey is required" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!reason) {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  const evaluation = await evaluateAdminRefund(paymentKey);
  if (!evaluation.ok) {
    return NextResponse.json({ error: evaluation.error }, { status: evaluation.status });
  }

  const { payment, preview } = evaluation;

  if (!preview.refundable || preview.refundAmount <= 0) {
    return NextResponse.json(
      {
        error: preview.reason,
        preview,
      },
      { status: 409 },
    );
  }

  if (getProvider(payment.metadata) === "tosspayments") {
    const idempotencyKey = randomUUID();
    const cancelResult = await requestTossPaymentsCancel({
      paymentKey,
      preview,
      reason,
      idempotencyKey,
    });

    if (!cancelResult.ok) {
      console.error("[Admin Cancel] TossPayments cancel failed:", cancelResult.data);
      const message =
        typeof cancelResult.data.message === "string"
          ? cancelResult.data.message
          : "토스페이먼츠 취소 요청이 실패했습니다.";
      return NextResponse.json({ error: message, details: cancelResult.data }, { status: 502 });
    }

    return applyTossPaymentsRefund({
      admin: createAdminClient(),
      adminEmail: adminCheck.user.email || "unknown",
      payment: payment as RefundPaymentRow,
      preview,
      reason,
      cancelResponse: cancelResult.data,
      idempotencyKey,
    });
  }

  if (!PORTONE_API_SECRET) {
    return NextResponse.json(
      { error: "PORTONE_API_SECRET is not configured" },
      { status: 500 },
    );
  }

  const portoneClient = PaymentClient({ secret: PORTONE_API_SECRET });

  try {
    await portoneClient.cancelPayment({
      paymentId: paymentKey,
      reason,
      ...(preview.requiresPartialCancel
        ? {
            amount: preview.refundAmount,
            currentCancellableAmount: payment.amount,
          }
        : {}),
    });
  } catch (portoneError) {
    console.error("[Admin Cancel] portone cancelPayment failed:", portoneError);
    const message =
      portoneError instanceof Error
        ? portoneError.message
        : "포트원 취소 요청이 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const finalized = await finalizePortOnePayment(paymentKey, { forceRefresh: true });
  const finalizedStatus = "status" in finalized ? finalized.status : undefined;
  const finalizedError = "error" in finalized ? finalized.error : undefined;
  const cancellationApplied =
    (typeof finalizedStatus === "string" && APPLIED_CANCEL_STATUSES.has(finalizedStatus)) ||
    Boolean(finalized.success);

  const adminClient = createAdminClient();
  const { error: auditError } = await adminClient
    .from("toss_payments")
    .update({
      metadata: {
        ...(payment.metadata || {}),
        adminCancel: {
          at: new Date().toISOString(),
          by: adminCheck.user.email,
          reason,
          requestedRefundAmount: preview.refundAmount,
          paymentAmount: preview.paymentAmount,
          refundType: preview.refundType,
          revokeScope: preview.revokeScope,
          elapsedDays: preview.elapsedDays,
          lectureCount: preview.lectureCount,
          creditsUsed: preview.creditsUsed,
          materialDownloadTracked: preview.materialDownloadTracked,
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", paymentKey);

  if (auditError) {
    console.error("[Admin Cancel] failed to write adminCancel metadata:", auditError);
  }

  if (!cancellationApplied) {
    return NextResponse.json(
      {
        success: true,
        pendingSync: true,
        message: finalizedError || "취소 요청은 접수됐지만 상태 반영이 지연 중입니다.",
        preview,
      },
      { status: 202 },
    );
  }

  return NextResponse.json({
    success: true,
    paymentKey,
    preview,
    portoneStatus:
      finalizedStatus ?? (preview.requiresPartialCancel ? "PARTIAL_CANCELLED" : "CANCELLED"),
    message: preview.requiresPartialCancel
      ? "규정에 따른 부분 환불이 처리되었고, 이용권과 잔여 크레딧은 회수되었습니다."
      : "환불이 처리되었고, 관련 권한과 크레딧 회수가 반영되었습니다.",
  });
}
