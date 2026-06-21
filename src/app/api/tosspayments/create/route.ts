import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { getEarlybirdSummary } from "@/lib/marketing/earlybird";
import {
  MARKETING_SESSION_COOKIE,
  MARKETING_TOKEN_COOKIE,
} from "@/lib/marketing/tracking";
import { validateCheckoutCoupon } from "@/lib/payments/coupons";
import { buildGrantSnapshotMetadata } from "@/lib/payments/grant-snapshot";
import { isActiveAccessPlan } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import {
  getEarlybirdBonusCredits,
  isTossPayPlanType,
  TOSSPAY_PLAN_CONFIG,
} from "@/lib/tosspay/config";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

function resolveOrigin(request: NextRequest) {
  const envOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
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

function normalizeMarketingSession(
  request: NextRequest,
  bodySessionKey?: string,
  bodyMarketingToken?: string,
) {
  const rawSessionKey = bodySessionKey || request.cookies.get(MARKETING_SESSION_COOKIE)?.value;
  const rawMarketingToken =
    bodyMarketingToken || request.cookies.get(MARKETING_TOKEN_COOKIE)?.value;
  const SESSION_KEY_RE = /^[0-9a-f-]{36}$/i;

  return {
    sessionKey:
      typeof rawSessionKey === "string" && SESSION_KEY_RE.test(rawSessionKey)
        ? rawSessionKey
        : null,
    marketingToken:
      typeof rawMarketingToken === "string" &&
      rawMarketingToken.length > 0 &&
      rawMarketingToken.length <= 100
        ? rawMarketingToken
        : null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim() || "";
    if (!clientKey) {
      return NextResponse.json(
        { error: "토스페이먼츠 클라이언트 키가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      planType,
      buyerEmail: rawBuyerEmail,
      locale: rawLocale,
      couponCode: rawCouponCode,
      sessionKey: rawBodySessionKey,
      marketingToken: rawBodyMarketingToken,
    } = body as {
      planType?: string;
      buyerEmail?: string;
      locale?: string;
      couponCode?: string | null;
      sessionKey?: string;
      marketingToken?: string;
    };

    const { sessionKey, marketingToken } = normalizeMarketingSession(
      request,
      rawBodySessionKey,
      rawBodyMarketingToken,
    );

    if (!planType || !isTossPayPlanType(planType)) {
      return NextResponse.json({ error: "유효하지 않은 플랜입니다." }, { status: 400 });
    }

    const currentPlan = await getEffectiveCreditInfo(user.id);
    if (isActiveAccessPlan(currentPlan?.plan_type, currentPlan?.expires_at)) {
      return NextResponse.json(
        { error: "이미 활성화된 올인원 이용권이 있습니다." },
        { status: 409 },
      );
    }

    const buyerEmail = (rawBuyerEmail || user.email || "").trim();
    const plan = TOSSPAY_PLAN_CONFIG[planType];
    const locale = rawLocale === "en" ? "en" : "ko";

    const couponResult = rawCouponCode
      ? await validateCheckoutCoupon({
          couponCode: rawCouponCode,
          context: "allinone",
          originalAmount: plan.amount,
          userId: user.id,
        })
      : null;

    if (couponResult && !couponResult.ok) {
      return NextResponse.json({ error: couponResult.message }, { status: 400 });
    }

    const appliedCoupon = couponResult && couponResult.ok ? couponResult : null;
    const chargeAmount = appliedCoupon?.finalAmount ?? plan.amount;
    const admin = createAdminClient();

    const orderId = `flowspot_${user.id.slice(0, 8)}_${Date.now()}`;
    const paymentKeyPlaceholder = `tosspayments-${randomUUID()}`;

    const earlybirdSummary = await getEarlybirdSummary(admin);
    const earlybirdTier =
      earlybirdSummary.currentTier === "ended" ? null : earlybirdSummary.currentTier;
    const earlybirdBonusCredits = getEarlybirdBonusCredits(earlybirdTier);
    const immediateGrantedCredits = plan.initialCredits + earlybirdBonusCredits;
    const grantSnapshot = buildGrantSnapshotMetadata({
      paymentKind: "initial_program",
      chargedAmount: chargeAmount,
      grantedSubscriptionCredits: plan.initialCredits,
      grantedPurchasedCredits: earlybirdBonusCredits,
      planType,
      userPlanType: plan.userPlanType,
      monthlyCredits: plan.monthlyCredits,
      months: plan.months,
      earlybirdTier,
    });

    const couponMetadata = appliedCoupon
      ? {
          couponCode: appliedCoupon.coupon.code,
          couponLabel: appliedCoupon.coupon.label,
          couponDescription: appliedCoupon.coupon.description,
          couponDiscount: appliedCoupon.discountAmount,
          couponOriginalAmount: appliedCoupon.originalAmount,
          couponFinalAmount: appliedCoupon.finalAmount,
          couponExpiresAt: appliedCoupon.coupon.expiresAt || null,
        }
      : {};

    const metadata = {
      provider: "tosspayments",
      pgProvider: "tosspayments",
      mid: process.env.TOSS_MID?.trim() || "flowkogh98",
      apiVersion: process.env.TOSS_API_VERSION?.trim() || "2024-06-01",
      buyerEmail,
      planType,
      paymentKind: plan.paymentKind,
      userPlanType: plan.userPlanType,
      earlybirdTier,
      monthlyCredits: plan.monthlyCredits,
      months: plan.months,
      sessionKey,
      marketingToken,
      ...couponMetadata,
      ...grantSnapshot,
    };

    const { error: insertError } = await admin.from("toss_payments").insert({
      user_id: user.id,
      payment_key: paymentKeyPlaceholder,
      order_id: orderId,
      order_name: `FlowSpot ${plan.name}`,
      amount: chargeAmount,
      credits: immediateGrantedCredits,
      status: "PENDING",
      metadata,
      session_key: sessionKey,
      marketing_token: marketingToken,
    });

    if (insertError) {
      console.error("[TossPayments Create] Failed to persist pending order:", insertError);
      return NextResponse.json(
        { error: "결제 주문 저장에 실패했습니다. 다시 시도해 주세요." },
        { status: 500 },
      );
    }

    const origin = resolveOrigin(request);

    return NextResponse.json({
      success: true,
      clientKey,
      customerKey: user.id,
      customerEmail: buyerEmail,
      orderId,
      orderName: `FlowSpot ${plan.name}`,
      amount: chargeAmount,
      couponApplied: Boolean(appliedCoupon),
      successUrl: `${origin}/${locale}/dashboard/credits/success`,
      failUrl: `${origin}/${locale}/dashboard/credits/fail`,
    });
  } catch (error) {
    console.error("[TossPayments Create] Error:", error);
    return NextResponse.json(
      { error: "결제 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
