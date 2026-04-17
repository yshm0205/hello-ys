/**
 * Credits Purchase API Route
 * 추가 구매 크레딧은 누적형 버킷에 적립된다.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  loadCreditPlanSnapshot,
  updateCreditPlanBalances,
} from "@/lib/credits/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const CREDIT_PACKS: Record<number, { credits: number; price: number }> = {
  100: { credits: 100, price: 14900 },
  300: { credits: 300, price: 34900 },
  500: { credits: 500, price: 54900 },
  1000: { credits: 1000, price: 99900 },
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
    const packSize = body.pack as number;
    const paymentId = body.payment_id as string;

    const pack = packSize ? CREDIT_PACKS[packSize] : undefined;
    if (!pack) {
      return NextResponse.json(
        { success: false, error: `존재하지 않는 상품입니다. ${packSize}` },
        { status: 400 },
      );
    }

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "결제 검증 ID가 필요합니다." },
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
      return NextResponse.json(
        {
          success: false,
          error: "충전 처리 중 충돌이 발생했습니다. 다시 시도해 주세요.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      credits: updateResult.plan.credits,
      added: pack.credits,
      message: `${pack.credits}cr 충전 완료! (보유: ${updateResult.plan.credits}cr)`,
    });
  } catch (error) {
    console.error("[Credits Purchase API] Error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
