import { NextRequest, NextResponse } from "next/server";

import {
  isTossPayPlanType,
  TOSSPAY_PLAN_CONFIG,
} from "@/lib/tosspay/config";
import { createClient } from "@/utils/supabase/server";

const TOSSPAY_API_URL = "https://pay.toss.im/api/v2/payments";
const TOSSPAY_API_KEY = process.env.TOSSPAY_API_KEY || "";

interface TossPayCreateResponse {
  code: number;
  errorCode?: string;
  msg?: string;
  payToken?: string;
  checkoutPage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    if (!TOSSPAY_API_KEY) {
      return NextResponse.json(
        { error: "TossPay API 설정이 없습니다." },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { planType } = body as { planType?: string };

    if (!planType || !isTossPayPlanType(planType)) {
      return NextResponse.json(
        { error: "지원하지 않는 플랜입니다." },
        { status: 400 },
      );
    }

    const plan = TOSSPAY_PLAN_CONFIG[planType];
    const orderId = `flowspot_${user.id.slice(0, 8)}_${Date.now()}`;
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || "https://flowspot-kr.vercel.app";

    const tossRes = await fetch(TOSSPAY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: TOSSPAY_API_KEY,
        orderNo: orderId,
        amount: plan.amount,
        amountTaxFree: 0,
        productDesc: `FlowSpot ${plan.name}`,
        autoExecute: true,
        resultCallback: `${origin}/api/tosspay/callback`,
        retUrl: `${origin}/ko/dashboard/credits/success?orderNo=${orderId}&planType=${planType}`,
        retCancelUrl: `${origin}/ko/dashboard/credits/fail`,
        callbackVersion: "V2",
      }),
    });

    const tossData: TossPayCreateResponse = await tossRes.json();

    if (tossData.code !== 0 || !tossData.checkoutPage || !tossData.payToken) {
      console.error("[TossPay] Create failed:", tossData);
      return NextResponse.json(
        { error: tossData.msg || "결제 생성에 실패했습니다." },
        { status: 400 },
      );
    }

    const { createAdminClient } = await import("@/utils/supabase/admin");
    const admin = createAdminClient();

    const { error: insertError } = await admin.from("toss_payments").insert({
      user_id: user.id,
      payment_key: tossData.payToken,
      order_id: orderId,
      order_name: `FlowSpot ${plan.name}`,
      amount: plan.amount,
      credits: plan.initialCredits,
      status: "PENDING",
      metadata: {
        planType,
        payToken: tossData.payToken,
        paymentKind: plan.paymentKind,
        userPlanType: plan.userPlanType,
        initialCredits: plan.initialCredits,
        monthlyCredits: plan.monthlyCredits,
        months: plan.months,
      },
    });

    if (insertError) {
      console.error("[TossPay Create] Failed to persist pending order:", insertError);
      return NextResponse.json(
        { error: "결제 주문 저장에 실패했습니다. 다시 시도해 주세요." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      checkoutPage: tossData.checkoutPage,
      orderId,
      payToken: tossData.payToken,
    });
  } catch (error) {
    console.error("[TossPay Create] Error:", error);
    return NextResponse.json(
      { error: "결제 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
