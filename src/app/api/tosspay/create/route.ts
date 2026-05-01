import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  getEarlybirdBonusCredits,
  isTossPayPlanType,
  TOSSPAY_PLAN_CONFIG,
} from "@/lib/tosspay/config";
import { getEarlybirdSummary } from "@/lib/marketing/earlybird";
import { buildGrantSnapshotMetadata } from "@/lib/payments/grant-snapshot";
import { isActiveAccessPlan } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { createClient } from "@/utils/supabase/server";

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

    const body = await request.json().catch(() => ({}));
    const {
      planType,
      buyerEmail: rawBuyerEmail,
      sessionKey: rawSessionKey,
      marketingToken: rawMarketingToken,
    } = body as {
      planType?: string;
      buyerEmail?: string;
      sessionKey?: string;
      marketingToken?: string;
    };

    const SESSION_KEY_RE = /^[0-9a-f-]{36}$/i;
    const sessionKey =
      typeof rawSessionKey === "string" && SESSION_KEY_RE.test(rawSessionKey)
        ? rawSessionKey
        : null;
    const marketingToken =
      typeof rawMarketingToken === "string" &&
      rawMarketingToken.length > 0 &&
      rawMarketingToken.length <= 100
        ? rawMarketingToken
        : null;

    if (!planType || !isTossPayPlanType(planType)) {
      return NextResponse.json(
        { error: "유효하지 않은 플랜입니다." },
        { status: 400 },
      );
    }

    const currentPlan = await getEffectiveCreditInfo(user.id);
    if (isActiveAccessPlan(currentPlan?.plan_type, currentPlan?.expires_at)) {
      return NextResponse.json(
        { error: "Active all-in-one access already exists." },
        { status: 409 },
      );
    }

    const buyerEmail = (rawBuyerEmail || user.email || "").trim();
    const plan = TOSSPAY_PLAN_CONFIG[planType];
    const orderId = `flowspot_${user.id.slice(0, 8)}_${Date.now()}`;
    const paymentId = `payment-${randomUUID()}`;

    const { createAdminClient } = await import("@/utils/supabase/admin");
    const admin = createAdminClient();
    const earlybirdSummary = await getEarlybirdSummary(admin);
    const earlybirdTier =
      earlybirdSummary.currentTier === "ended" ? null : earlybirdSummary.currentTier;
    const earlybirdBonusCredits = getEarlybirdBonusCredits(earlybirdTier);
    const immediateGrantedCredits = plan.initialCredits + earlybirdBonusCredits;

    const { error: insertError } = await admin.from("toss_payments").insert({
      user_id: user.id,
      payment_key: paymentId,
      order_id: orderId,
      order_name: `FlowSpot ${plan.name}`,
      amount: plan.amount,
      credits: immediateGrantedCredits,
      status: "PENDING",
      session_key: sessionKey,
      marketing_token: marketingToken,
      metadata: {
        provider: "portone",
        pgProvider: "tosspay",
        paymentId,
        buyerEmail,
        planType,
        paymentKind: plan.paymentKind,
        userPlanType: plan.userPlanType,
        earlybirdTier,
        monthlyCredits: plan.monthlyCredits,
        months: plan.months,
        sessionKey,
        marketingToken,
        ...buildGrantSnapshotMetadata({
          paymentKind: "initial_program",
          chargedAmount: plan.amount,
          grantedSubscriptionCredits: plan.initialCredits,
          grantedPurchasedCredits: earlybirdBonusCredits,
          planType,
          userPlanType: plan.userPlanType,
          monthlyCredits: plan.monthlyCredits,
          months: plan.months,
          earlybirdTier,
        }),
      },
    });

    if (insertError) {
      console.error("[Payments Program Create] Failed to persist pending order:", insertError);
      return NextResponse.json(
        { error: "결제 주문 저장에 실패했습니다. 다시 시도해 주세요." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      paymentId,
      orderId,
      orderName: `FlowSpot ${plan.name}`,
      amount: plan.amount,
      customerId: user.id,
      buyerEmail,
    });
  } catch (error) {
    console.error("[Payments Program Create] Error:", error);
    return NextResponse.json(
      { error: "결제 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
