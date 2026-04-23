import { randomBytes, randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  getEarlybirdBonusCredits,
  isTossPayPlanType,
  TOSSPAY_PLAN_CONFIG,
} from "@/lib/tosspay/config";
import { getEarlybirdSummary } from "@/lib/marketing/earlybird";
import { isActiveAccessPlan } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { createClient } from "@/utils/supabase/server";

const TOSSPAY_API_URL = "https://pay.toss.im/api/v2/payments";

type TossPayCreateResponse = {
  code?: number;
  errorCode?: string;
  msg?: string;
  status?: number;
  payToken?: string;
  checkoutPage?: string;
};

function resolveOrigin(request: NextRequest) {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envOrigin) return envOrigin.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  const host = request.headers.get("host");
  if (host) {
    const proto = host.startsWith("localhost") ? "http" : "https";
    return `${proto}://${host}`;
  }

  return "https://flowspot.kr";
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.TOSSPAY_API_KEY?.trim() || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "TOSSPAY_API_KEY가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

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
    const { planType, buyerEmail: rawBuyerEmail, locale: rawLocale } = body as {
      planType?: string;
      buyerEmail?: string;
      locale?: string;
    };

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
    const locale = rawLocale === "en" ? "en" : "ko";

    const orderNo = `flowspot_${user.id.slice(0, 8)}_${Date.now()}`;
    const payTokenPlaceholder = `payment-${randomUUID()}`;
    const callbackSecret = randomBytes(24).toString("hex");

    const { createAdminClient } = await import("@/utils/supabase/admin");
    const admin = createAdminClient();

    const earlybirdSummary = await getEarlybirdSummary(admin);
    const earlybirdTier =
      earlybirdSummary.currentTier === "ended" ? null : earlybirdSummary.currentTier;
    const earlybirdBonusCredits = getEarlybirdBonusCredits(earlybirdTier);
    const immediateGrantedCredits = plan.initialCredits + earlybirdBonusCredits;

    const origin = resolveOrigin(request);
    const retUrl = `${origin}/${locale}/dashboard/credits/success?orderNo=${encodeURIComponent(
      orderNo,
    )}`;
    const retCancelUrl = `${origin}/${locale}/checkout/allinone?cancelled=1`;
    const resultCallback = `${origin}/api/tosspay/callback?cb=${encodeURIComponent(
      callbackSecret,
    )}`;
    const productDesc = `FlowSpot ${plan.name}`.replace(/["\\]/g, "").slice(0, 250);

    const { error: insertError } = await admin.from("toss_payments").insert({
      user_id: user.id,
      payment_key: payTokenPlaceholder,
      order_id: orderNo,
      order_name: `FlowSpot ${plan.name}`,
      amount: plan.amount,
      credits: immediateGrantedCredits,
      status: "PENDING",
      metadata: {
        provider: "tosspay-direct",
        pgProvider: "tosspay",
        buyerEmail,
        planType,
        paymentKind: plan.paymentKind,
        userPlanType: plan.userPlanType,
        initialCredits: plan.initialCredits,
        earlybirdTier,
        earlybirdBonusCredits,
        purchasedGranted: earlybirdBonusCredits,
        monthlyCredits: plan.monthlyCredits,
        months: plan.months,
        callbackSecret,
      },
    });

    if (insertError) {
      console.error("[TossPay Direct] Failed to persist pending order:", insertError);
      return NextResponse.json(
        { error: "결제 주문 저장에 실패했습니다. 다시 시도해 주세요." },
        { status: 500 },
      );
    }

    const tossResponse = await fetch(TOSSPAY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        orderNo,
        productDesc,
        retUrl,
        retCancelUrl,
        amount: plan.amount,
        amountTaxFree: 0,
        resultCallback,
        callbackVersion: "V2",
        autoExecute: true,
      }),
    });

    const tossData = (await tossResponse.json().catch(() => ({}))) as TossPayCreateResponse;

    if (tossData.code !== 0 || !tossData.checkoutPage || !tossData.payToken) {
      console.error("[TossPay Direct] TossPay API error:", tossData);

      await admin
        .from("toss_payments")
        .update({
          status: "CREATE_FAILED",
          metadata: {
            provider: "tosspay-direct",
            pgProvider: "tosspay",
            buyerEmail,
            planType,
            paymentKind: plan.paymentKind,
            userPlanType: plan.userPlanType,
            initialCredits: plan.initialCredits,
            earlybirdTier,
            earlybirdBonusCredits,
            purchasedGranted: earlybirdBonusCredits,
            monthlyCredits: plan.monthlyCredits,
            months: plan.months,
            callbackSecret,
            tossErrorCode: tossData.errorCode || null,
            tossErrorMessage: tossData.msg || null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderNo);

      return NextResponse.json(
        {
          error:
            tossData.msg || "토스페이 결제 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
          code: tossData.errorCode || null,
        },
        { status: 502 },
      );
    }

    await admin
      .from("toss_payments")
      .update({
        payment_key: tossData.payToken,
        metadata: {
          provider: "tosspay-direct",
          pgProvider: "tosspay",
          buyerEmail,
          planType,
          paymentKind: plan.paymentKind,
          userPlanType: plan.userPlanType,
          initialCredits: plan.initialCredits,
          earlybirdTier,
          earlybirdBonusCredits,
          purchasedGranted: earlybirdBonusCredits,
          monthlyCredits: plan.monthlyCredits,
          months: plan.months,
          callbackSecret,
          payToken: tossData.payToken,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderNo);

    return NextResponse.json({
      success: true,
      orderNo,
      payToken: tossData.payToken,
      checkoutPage: tossData.checkoutPage,
    });
  } catch (error) {
    console.error("[TossPay Direct] Error:", error);
    return NextResponse.json(
      { error: "결제 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
