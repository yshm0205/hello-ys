import { randomBytes, randomUUID } from 'crypto';

import { NextRequest, NextResponse } from 'next/server';

import { getEarlybirdSummary } from '@/lib/marketing/earlybird';
import { validateCheckoutCoupon } from '@/lib/payments/coupons';
import { buildGrantSnapshotMetadata } from '@/lib/payments/grant-snapshot';
import { isActiveAccessPlan } from '@/lib/plans/config';
import { getEffectiveCreditInfo } from '@/lib/plans/server';
import {
  getEarlybirdBonusCredits,
  isTossPayPlanType,
  TOSSPAY_PLAN_CONFIG,
} from '@/lib/tosspay/config';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

const TOSSPAY_API_URL = 'https://pay.toss.im/api/v2/payments';

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
  if (envOrigin) return envOrigin.replace(/\/$/, '');

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  const host = request.headers.get('host');
  if (host) {
    const proto = host.startsWith('localhost') ? 'http' : 'https';
    return `${proto}://${host}`;
  }

  return 'https://flowspot.kr';
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.TOSSPAY_API_KEY?.trim() || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TOSSPAY_API_KEY가 설정되지 않았습니다.' },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      planType,
      buyerEmail: rawBuyerEmail,
      locale: rawLocale,
      couponCode: rawCouponCode,
      sessionKey: rawSessionKey,
      marketingToken: rawMarketingToken,
    } = body as {
      planType?: string;
      buyerEmail?: string;
      locale?: string;
      couponCode?: string | null;
      sessionKey?: string;
      marketingToken?: string;
    };

    const SESSION_KEY_RE = /^[0-9a-f-]{36}$/i;
    const sessionKey =
      typeof rawSessionKey === 'string' && SESSION_KEY_RE.test(rawSessionKey)
        ? rawSessionKey
        : null;
    const marketingToken =
      typeof rawMarketingToken === 'string' &&
      rawMarketingToken.length > 0 &&
      rawMarketingToken.length <= 100
        ? rawMarketingToken
        : null;

    if (!planType || !isTossPayPlanType(planType)) {
      return NextResponse.json({ error: '유효하지 않은 플랜입니다.' }, { status: 400 });
    }

    const currentPlan = await getEffectiveCreditInfo(user.id);
    if (isActiveAccessPlan(currentPlan?.plan_type, currentPlan?.expires_at)) {
      return NextResponse.json(
        { error: '이미 활성화된 올인원 이용권이 있습니다.' },
        { status: 409 },
      );
    }

    const buyerEmail = (rawBuyerEmail || user.email || '').trim();
    const plan = TOSSPAY_PLAN_CONFIG[planType];
    const locale = rawLocale === 'en' ? 'en' : 'ko';

    const couponResult = rawCouponCode
      ? await validateCheckoutCoupon({
          couponCode: rawCouponCode,
          context: 'allinone',
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

    const orderNo = `flowspot_${user.id.slice(0, 8)}_${Date.now()}`;
    const payTokenPlaceholder = `payment-${randomUUID()}`;
    const callbackSecret = randomBytes(24).toString('hex');

    const earlybirdSummary = await getEarlybirdSummary(admin);
    const earlybirdTier =
      earlybirdSummary.currentTier === 'ended' ? null : earlybirdSummary.currentTier;
    const earlybirdBonusCredits = getEarlybirdBonusCredits(earlybirdTier);
    const immediateGrantedCredits = plan.initialCredits + earlybirdBonusCredits;
    const grantSnapshot = buildGrantSnapshotMetadata({
      paymentKind: 'initial_program',
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
      provider: 'tosspay-direct',
      pgProvider: 'tosspay',
      buyerEmail,
      planType,
      paymentKind: plan.paymentKind,
      userPlanType: plan.userPlanType,
      earlybirdTier,
      monthlyCredits: plan.monthlyCredits,
      months: plan.months,
      callbackSecret,
      sessionKey,
      marketingToken,
      ...couponMetadata,
      ...grantSnapshot,
    };

    const origin = resolveOrigin(request);
    const retUrl = `${origin}/${locale}/dashboard/credits/success?orderNo=${encodeURIComponent(
      orderNo,
    )}`;
    const cancelParams = new URLSearchParams({ cancelled: '1' });
    if (appliedCoupon) {
      cancelParams.set('coupon', appliedCoupon.coupon.code);
    }
    const retCancelUrl = `${origin}/${locale}/checkout/allinone?${cancelParams.toString()}`;
    const resultCallback = `${origin}/api/tosspay/callback?cb=${encodeURIComponent(
      callbackSecret,
    )}`;
    const productDesc = `FlowSpot ${plan.name}`.replace(/["\\]/g, '').slice(0, 250);

    const { error: insertError } = await admin.from('toss_payments').insert({
      user_id: user.id,
      payment_key: payTokenPlaceholder,
      order_id: orderNo,
      order_name: `FlowSpot ${plan.name}`,
      amount: chargeAmount,
      credits: immediateGrantedCredits,
      status: 'PENDING',
      metadata,
      session_key: sessionKey,
      marketing_token: marketingToken,
    });

    if (insertError) {
      console.error('[TossPay Direct] Failed to persist pending order:', insertError);
      return NextResponse.json(
        { error: '결제 주문 저장에 실패했습니다. 다시 시도해 주세요.' },
        { status: 500 },
      );
    }

    const tossResponse = await fetch(TOSSPAY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        orderNo,
        productDesc,
        retUrl,
        retCancelUrl,
        amount: chargeAmount,
        amountTaxFree: 0,
        resultCallback,
        callbackVersion: 'V2',
        autoExecute: true,
      }),
    });

    const tossData = (await tossResponse.json().catch(() => ({}))) as TossPayCreateResponse;

    if (tossData.code !== 0 || !tossData.checkoutPage || !tossData.payToken) {
      console.error('[TossPay Direct] TossPay API error:', tossData);

      await admin
        .from('toss_payments')
        .update({
          status: 'CREATE_FAILED',
          metadata: {
            ...metadata,
            tossErrorCode: tossData.errorCode || null,
            tossErrorMessage: tossData.msg || null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderNo);

      return NextResponse.json(
        {
          error:
            tossData.msg || '토스페이 결제 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          code: tossData.errorCode || null,
        },
        { status: 502 },
      );
    }

    await admin
      .from('toss_payments')
      .update({
        payment_key: tossData.payToken,
        metadata: {
          ...metadata,
          payToken: tossData.payToken,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderNo);

    return NextResponse.json({
      success: true,
      orderNo,
      payToken: tossData.payToken,
      checkoutPage: tossData.checkoutPage,
      amount: chargeAmount,
      couponApplied: Boolean(appliedCoupon),
    });
  } catch (error) {
    console.error('[TossPay Direct] Error:', error);
    return NextResponse.json(
      { error: '결제 생성에 실패했습니다.' },
      { status: 500 },
    );
  }
}
