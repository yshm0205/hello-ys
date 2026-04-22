import { NextRequest, NextResponse } from "next/server";

import {
  loadCreditPlanSnapshot,
  recordCreditTransaction,
  updateCreditPlanBalances,
} from "@/lib/credits/server";
import { finalizePortOnePayment } from "@/lib/payments/portone";
import { CREDIT_TOPUP_PACKS } from "@/lib/plans/config";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const CONFIRMABLE_PAYMENT_STATUSES = ["PENDING", "CONFIRM_FAILED", "CREDIT_GRANT_FAILED"];

type PendingPaymentRow = {
  order_id: string;
  order_name: string | null;
  amount: number;
  credits: number | null;
  status: string | null;
  payment_key: string | null;
  metadata?: Record<string, unknown> | null;
};

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

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: "paymentKey, orderId, amount가 필요합니다." },
        { status: 400 },
      );
    }

    const pack = CREDIT_TOPUP_PACKS.find((candidate) => candidate.amount === amount);
    if (!pack) {
      return NextResponse.json(
        { success: false, error: `유효하지 않은 결제 금액입니다. ${amount}` },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
    const { data: pendingPayment, error: pendingPaymentError } = await adminClient
      .from("toss_payments")
      .select("order_id, order_name, amount, credits, status, payment_key, metadata")
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
      typeof payment.metadata?.paymentKind === "string" ? payment.metadata.paymentKind : null;

    if (paymentKind !== "credit_topup") {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 결제 주문입니다." },
        { status: 400 },
      );
    }

    if (payment.amount !== amount || (payment.credits ?? pack.credits) !== pack.credits) {
      return NextResponse.json(
        { success: false, error: "결제 주문 정보가 요청 값과 일치하지 않습니다." },
        { status: 400 },
      );
    }

    if (payment.status === "DONE") {
      const currentPlan = await loadCreditPlanSnapshot(adminClient, user.id);
      return NextResponse.json({
        success: true,
        credits: currentPlan?.credits ?? 0,
        added: payment.credits ?? pack.credits,
        orderId,
      });
    }

    const { data: processingRows, error: processingError } = await adminClient
      .from("toss_payments")
      .update({
        status: "PROCESSING",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .in("status", CONFIRMABLE_PAYMENT_STATUSES)
      .select("order_id");

    if (processingError) {
      console.error("[Payments Confirm] Failed to acquire processing lock:", processingError);
      return NextResponse.json(
        { success: false, error: "결제 처리 상태를 확보하지 못했습니다." },
        { status: 409 },
      );
    }

    if (!processingRows?.length) {
      return NextResponse.json(
        { success: false, error: "이미 처리 중이거나 완료된 결제입니다." },
        { status: 409 },
      );
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      await adminClient
        .from("toss_payments")
        .update({
          status: "CONFIRM_FAILED",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .eq("user_id", user.id);

      return NextResponse.json(
        { success: false, error: "결제 설정이 없습니다." },
        { status: 500 },
      );
    }

    const encryptedSecretKey = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error("[Payments Confirm] Toss confirm failed:", tossData);
      await adminClient
        .from("toss_payments")
        .update({
          status: "CONFIRM_FAILED",
          payment_key: paymentKey,
          metadata: {
            ...(payment.metadata || {}),
            paymentKind: "credit_topup",
            confirmError: tossData,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .eq("user_id", user.id);

      return NextResponse.json(
        { success: false, error: tossData.message || "결제 확인에 실패했습니다." },
        { status: 400 },
      );
    }

    const currentPlan = await loadCreditPlanSnapshot(adminClient, user.id);
    const updateResult = await updateCreditPlanBalances(adminClient, {
      userId: user.id,
      current: currentPlan,
      subscriptionCredits: currentPlan?.subscriptionCredits || 0,
      purchasedCredits: (currentPlan?.purchasedCredits || 0) + pack.credits,
      planType: currentPlan?.planType || "free",
      expiresAt: currentPlan?.expiresAt ?? null,
    });

    if (!updateResult.success) {
      console.error("[Payments Confirm] Credit update failed:", updateResult.error);
      await adminClient
        .from("toss_payments")
        .update({
          status: "CREDIT_GRANT_FAILED",
          payment_key: paymentKey,
          metadata: {
            ...(payment.metadata || {}),
            paymentKind: "credit_topup",
            paymentKey,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          success: false,
          error: "크레딧 충전 중 충돌이 발생했습니다. 다시 시도해 주세요.",
        },
        { status: 409 },
      );
    }

    const paymentUpdate = await adminClient
      .from("toss_payments")
      .update({
        payment_key: paymentKey,
        order_name: payment.order_name || `FlowSpot 크레딧 ${pack.credits}cr`,
        amount,
        credits: pack.credits,
        status: tossData.status || "DONE",
        metadata: {
          ...(payment.metadata || {}),
          provider: "toss",
          paymentKind: "credit_topup",
          paymentKey,
          packCredits: pack.credits,
          confirmedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("user_id", user.id);

    if (paymentUpdate.error) {
      console.error("[Payments Confirm] Failed to finalize payment row:", paymentUpdate.error);
      return NextResponse.json(
        { success: false, error: "결제 이력 저장에 실패했습니다. 수동 확인이 필요합니다." },
        { status: 500 },
      );
    }

    await recordCreditTransaction({
      userId: user.id,
      type: "charge",
      amount: pack.credits,
      balanceAfter: updateResult.plan.credits,
      description: `toss payment charge (${pack.credits}cr)`,
      referenceId: orderId,
      metadata: {
        provider: "toss",
        paymentKind: "credit_topup",
        paymentKey,
        amount,
        credits: pack.credits,
        purchasedGranted: pack.credits,
        subscriptionGranted: 0,
      },
    });

    return NextResponse.json({
      success: true,
      credits: updateResult.plan.credits,
      added: pack.credits,
      orderId: tossData.orderId,
    });
  } catch (error) {
    console.error("[Payments Confirm] Error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
