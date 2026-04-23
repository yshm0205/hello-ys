import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  loadCreditPlanSnapshot,
  recordCreditTransaction,
  updateCreditPlanBalances,
} from "@/lib/credits/server";
import { evaluateAdminRefund } from "@/lib/payments/refund-policy";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const TOSSPAY_REFUND_URL = "https://pay.toss.im/api/v2/refunds";

type TossPayRefundResponse = {
  code?: number;
  errorCode?: string;
  msg?: string;
  status?: number;
  refundNo?: string;
  refundedAmount?: number;
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

function assertDirectProvider(metadata: Record<string, unknown> | null | undefined) {
  return metadata?.provider === "tosspay-direct";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ payToken: string }> },
) {
  const adminCheck = await requireAdminUser();
  if (!adminCheck.ok) return adminCheck.response;

  const { payToken } = await params;
  if (!payToken) {
    return NextResponse.json({ error: "payToken is required" }, { status: 400 });
  }

  const evaluation = await evaluateAdminRefund(payToken);
  if (!evaluation.ok) {
    return NextResponse.json({ error: evaluation.error }, { status: evaluation.status });
  }

  if (!assertDirectProvider(evaluation.payment.metadata)) {
    return NextResponse.json(
      { error: "이 엔드포인트는 TossPay 직접 결제 건만 처리합니다." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    preview: evaluation.preview,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payToken: string }> },
) {
  const adminCheck = await requireAdminUser();
  if (!adminCheck.ok) return adminCheck.response;

  const apiKey = process.env.TOSSPAY_API_KEY?.trim() || "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "TOSSPAY_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const { payToken } = await params;
  if (!payToken) {
    return NextResponse.json({ error: "payToken is required" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  const evaluation = await evaluateAdminRefund(payToken);
  if (!evaluation.ok) {
    return NextResponse.json({ error: evaluation.error }, { status: evaluation.status });
  }

  if (!assertDirectProvider(evaluation.payment.metadata)) {
    return NextResponse.json(
      { error: "이 엔드포인트는 TossPay 직접 결제 건만 처리합니다." },
      { status: 400 },
    );
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

  const admin = createAdminClient();
  const refundNo = `refund-${randomUUID()}`;
  const refundAmount = preview.refundAmount;
  const isFullRefund = preview.refundType === "full";

  const refundResponse = await fetch(TOSSPAY_REFUND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      payToken,
      refundNo,
      amount: refundAmount,
      amountTaxFree: 0,
      reason: reason.slice(0, 200),
    }),
  });

  const refundData = (await refundResponse.json().catch(() => ({}))) as TossPayRefundResponse;

  if (refundData.code !== 0) {
    console.error("[TossPay Cancel] TossPay refund failed:", refundData);
    return NextResponse.json(
      {
        error: refundData.msg || "토스페이 환불 요청이 실패했습니다.",
        code: refundData.errorCode || null,
      },
      { status: 502 },
    );
  }

  const { data: lockRows } = await admin
    .from("toss_payments")
    .update({
      status: "CANCELLATION_PROCESSING",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", payToken)
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
            description: `tosspay cancelled: initial program (${totalRevoked}cr)`,
            referenceId: payment.order_id,
            metadata: {
              provider: "tosspay-direct",
              paymentKind: "initial_program",
              payToken,
              refundNo,
              revokedSubscriptionCredits,
              revokedPurchasedCredits,
              remainingShortfall,
              refundAmount,
            },
          });
        }
      }
    } else {
      // purchased_credits scope (credit_topup)
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
            description: `tosspay cancelled: credit topup (${totalRevoked}cr)`,
            referenceId: payment.order_id,
            metadata: {
              provider: "tosspay-direct",
              paymentKind: "credit_topup",
              payToken,
              refundNo,
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
    console.error("[TossPay Cancel] Plan/credit revoke failed:", revokeError);
    await admin
      .from("toss_payments")
      .update({
        status: "CANCELLATION_FAILED",
        metadata: {
          ...(payment.metadata || {}),
          manualReviewRequired: true,
          refundNo,
          refundAmount,
          tossRefundAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", payToken);

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
        refundNo,
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
          by: adminCheck.user.email,
          reason,
          refundAmount,
          refundNo,
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
    .eq("payment_key", payToken);

  return NextResponse.json({
    success: true,
    payToken,
    refundNo,
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
