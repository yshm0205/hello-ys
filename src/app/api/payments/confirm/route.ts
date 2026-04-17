import { NextRequest, NextResponse } from "next/server";

import {
  loadCreditPlanSnapshot,
  recordCreditTransaction,
  updateCreditPlanBalances,
} from "@/lib/credits/server";
import { CREDIT_TOPUP_PACKS } from "@/lib/plans/config";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

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
    const { paymentKey, orderId, amount } = body as {
      paymentKey?: string;
      orderId?: string;
      amount?: number;
    };

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

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
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
      return NextResponse.json(
        { success: false, error: tossData.message || "결제 확인에 실패했습니다." },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
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
      return NextResponse.json(
        {
          success: false,
          error: "크레딧 충전 중 충돌이 발생했습니다. 다시 시도해 주세요.",
        },
        { status: 409 },
      );
    }

    await adminClient.from("toss_payments").insert({
      user_id: user.id,
      payment_key: paymentKey,
      order_id: orderId,
      order_name: `FlowSpot 크레딧 ${pack.credits}cr`,
      amount,
      credits: pack.credits,
      status: tossData.status || "DONE",
    });

    await recordCreditTransaction({
      userId: user.id,
      type: "charge",
      amount: pack.credits,
      balanceAfter: updateResult.plan.credits,
      description: `toss payment charge (${pack.credits}cr)`,
      referenceId: orderId,
      metadata: {
        provider: "toss",
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
