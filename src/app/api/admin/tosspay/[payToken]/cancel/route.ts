import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  loadCreditPlanSnapshot,
  recordCreditTransaction,
  updateCreditPlanBalances,
} from "@/lib/credits/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const TOSSPAY_REFUND_URL = "https://pay.toss.im/api/v2/refunds";

type StoredPaymentRow = {
  user_id: string;
  order_id: string;
  order_name: string;
  amount: number;
  credits: number;
  status: string;
  payment_key: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

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

function getPaymentKind(payment: StoredPaymentRow): "initial_program" | "credit_topup" | null {
  const metadataKind = payment.metadata?.paymentKind;
  if (metadataKind === "initial_program" || metadataKind === "credit_topup") {
    return metadataKind;
  }
  return null;
}

function getGrantedCredits(payment: StoredPaymentRow) {
  const initial = payment.metadata?.initialCredits;
  if (typeof initial === "number" && Number.isFinite(initial)) {
    return Math.max(0, initial);
  }
  return Math.max(0, payment.credits || 0);
}

function getPurchasedGrantedCredits(payment: StoredPaymentRow) {
  const value = payment.metadata?.purchasedGranted;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  return 0;
}

async function loadDirectPayment(payToken: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("toss_payments")
    .select(
      "user_id, order_id, order_name, amount, credits, status, payment_key, metadata, created_at",
    )
    .eq("payment_key", payToken)
    .maybeSingle();

  if (error) {
    console.error("[TossPay Cancel] Failed to load payment:", error);
    return { ok: false as const, status: 500, error: "결제 조회에 실패했습니다." };
  }

  if (!data) {
    return { ok: false as const, status: 404, error: "결제를 찾을 수 없습니다." };
  }

  const payment = data as StoredPaymentRow;
  const provider = payment.metadata?.provider;
  if (provider !== "tosspay-direct") {
    return {
      ok: false as const,
      status: 400,
      error: "이 엔드포인트는 TossPay 직접 결제 건만 처리합니다.",
    };
  }

  return { ok: true as const, payment };
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

  const loaded = await loadDirectPayment(payToken);
  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  const { payment } = loaded;
  const paymentKind = getPaymentKind(payment);

  return NextResponse.json({
    success: true,
    preview: {
      payToken,
      orderId: payment.order_id,
      orderName: payment.order_name,
      amount: payment.amount,
      grantedCredits: getGrantedCredits(payment),
      status: payment.status,
      paymentKind,
      refundable: payment.status === "DONE",
      createdAt: payment.created_at,
    },
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
  const requestedAmount =
    typeof body?.amount === "number" && Number.isFinite(body.amount) && body.amount > 0
      ? Math.floor(body.amount)
      : null;

  if (!reason) {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  const loaded = await loadDirectPayment(payToken);
  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  const { payment } = loaded;

  if (payment.status !== "DONE") {
    return NextResponse.json(
      { error: `현재 상태(${payment.status})에서는 취소할 수 없습니다.` },
      { status: 409 },
    );
  }

  const refundAmount = requestedAmount ?? payment.amount;
  if (refundAmount > payment.amount) {
    return NextResponse.json(
      { error: "결제 금액보다 큰 환불은 요청할 수 없습니다." },
      { status: 400 },
    );
  }

  const isFullRefund = refundAmount === payment.amount;
  const refundNo = `refund-${randomUUID()}`;
  const admin = createAdminClient();

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

  const paymentKind = getPaymentKind(payment);
  const currentPlan = await loadCreditPlanSnapshot(admin, payment.user_id);
  const currentSubscriptionCredits = currentPlan?.subscriptionCredits || 0;
  const currentPurchasedCredits = currentPlan?.purchasedCredits || 0;

  let revokedSubscriptionCredits = 0;
  let revokedPurchasedCredits = 0;
  let remainingShortfall = 0;

  if (isFullRefund) {
    if (paymentKind === "initial_program") {
      revokedSubscriptionCredits = currentSubscriptionCredits;
      const grantedPurchased = getPurchasedGrantedCredits(payment);
      revokedPurchasedCredits = Math.min(currentPurchasedCredits, grantedPurchased);
      remainingShortfall = Math.max(0, grantedPurchased - revokedPurchasedCredits);

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
        await admin
          .from("toss_payments")
          .update({
            status: "CANCELLATION_FAILED",
            metadata: {
              ...(payment.metadata || {}),
              manualReviewRequired: true,
              refundNo,
              tossRefundAt: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("payment_key", payToken);

        return NextResponse.json(
          { error: "환불은 접수되었으나 이용권 회수에 실패했습니다. 관리자 확인 필요." },
          { status: 500 },
        );
      }

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
    } else if (paymentKind === "credit_topup") {
      const granted = getGrantedCredits(payment);
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
        await admin
          .from("toss_payments")
          .update({
            status: "CANCELLATION_FAILED",
            metadata: {
              ...(payment.metadata || {}),
              manualReviewRequired: true,
              refundNo,
              tossRefundAt: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("payment_key", payToken);

        return NextResponse.json(
          { error: "환불은 접수되었으나 크레딧 회수에 실패했습니다. 관리자 확인 필요." },
          { status: 500 },
        );
      }

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
        adminCancel: {
          at: new Date().toISOString(),
          by: adminCheck.user.email,
          reason,
          refundAmount,
          refundNo,
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
    revokedSubscriptionCredits,
    revokedPurchasedCredits,
    remainingShortfall,
    message: isFullRefund
      ? "환불 완료되었고 이용권/크레딧이 회수되었습니다."
      : "부분 환불 완료. 크레딧/플랜 조정은 수동 확인이 필요합니다.",
  });
}
