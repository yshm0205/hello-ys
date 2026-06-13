import { NextRequest, NextResponse } from "next/server";

import { validateCheckoutCoupon } from "@/lib/payments/coupons";
import { isActiveAccessPlan, TOSSPAY_PLAN_CONFIG } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const DEFAULT_LATPEED_ALLINONE_URL = "https://www.latpeed.com/products/XMX_O/pay?theme=dark";
const LATPEED_CHALLENGE_DISCOUNT_URL =
  process.env.NEXT_PUBLIC_LATPEED_CHALLENGE_DISCOUNT_URL?.trim() ||
  process.env.LATPEED_CHALLENGE_DISCOUNT_URL?.trim() ||
  "";

function normalizeEmail(value?: string | null) {
  const email = (value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function readUserName(userMetadata: Record<string, unknown> | null | undefined) {
  const fullName = userMetadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();

  const name = userMetadata?.name;
  if (typeof name === "string" && name.trim()) return name.trim();

  return "";
}

function isMissingIntentTable(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  return code === "42P01" || code === "PGRST205" || code === "PGRST204";
}

export async function POST(request: NextRequest) {
  const defaultRedirectUrl =
    process.env.NEXT_PUBLIC_LATPEED_ALLINONE_URL?.trim() ||
    process.env.LATPEED_ALLINONE_URL?.trim() ||
    DEFAULT_LATPEED_ALLINONE_URL;

  if (!defaultRedirectUrl) {
    return NextResponse.json(
      { error: "카드/간편결제 링크가 아직 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { couponCode?: string | null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const email = normalizeEmail(user.email);
  if (!email) {
    return NextResponse.json(
      { error: "FlowSpot 계정 이메일을 확인할 수 없습니다." },
      { status: 400 },
    );
  }

  const currentPlan = await getEffectiveCreditInfo(user.id);
  if (isActiveAccessPlan(currentPlan?.plan_type, currentPlan?.expires_at)) {
    return NextResponse.json(
      { error: "이미 활성화된 올인원 이용권이 있습니다." },
      { status: 409 },
    );
  }

  const admin = createAdminClient();
  const nameFromAuth = readUserName(user.user_metadata as Record<string, unknown> | null);
  let userName = nameFromAuth;

  if (!userName) {
    const { data: profile } = await admin
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (typeof profile?.full_name === "string") {
      userName = profile.full_name.trim();
    }
  }

  const plan = TOSSPAY_PLAN_CONFIG.allinone;
  const couponResult = body.couponCode
    ? await validateCheckoutCoupon({
        couponCode: body.couponCode,
        context: "allinone",
        originalAmount: plan.amount,
        userId: user.id,
      })
    : null;

  if (couponResult && !couponResult.ok) {
    return NextResponse.json({ error: couponResult.message }, { status: 400 });
  }

  const appliedCoupon = couponResult && couponResult.ok ? couponResult : null;
  const redirectUrl = appliedCoupon ? LATPEED_CHALLENGE_DISCOUNT_URL : defaultRedirectUrl;
  const checkoutAmount = appliedCoupon?.finalAmount ?? plan.amount;

  if (!redirectUrl) {
    return NextResponse.json(
      { error: "할인 카드/간편결제 링크가 아직 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const { error } = await admin.from("latpeed_payment_intents").insert({
    user_id: user.id,
    user_email: email,
    user_name: userName || null,
    amount: checkoutAmount,
    status: "pending",
    expires_at: expiresAt.toISOString(),
    metadata: {
      provider: "latpeed",
      planType: "allinone",
      paymentKind: plan.paymentKind,
      couponCode: appliedCoupon?.coupon.code || null,
      couponLabel: appliedCoupon?.coupon.label || null,
      couponDiscount: appliedCoupon?.discountAmount || 0,
      couponOriginalAmount: appliedCoupon?.originalAmount || plan.amount,
      couponFinalAmount: appliedCoupon?.finalAmount || plan.amount,
      couponExpiresAt: appliedCoupon?.coupon.expiresAt || null,
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
    },
  });

  if (error) {
    if (isMissingIntentTable(error)) {
      console.warn("[Latpeed Intent] intent table missing; redirecting without intent lock");
      return NextResponse.json({
        ok: true,
        redirectUrl,
        email,
        expiresAt: expiresAt.toISOString(),
        intentRecorded: false,
      });
    }

    console.error("[Latpeed Intent] insert failed:", error);
    return NextResponse.json(
      { error: "카드/간편결제 준비 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    redirectUrl,
    email,
    expiresAt: expiresAt.toISOString(),
    intentRecorded: true,
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
