import { NextRequest, NextResponse } from 'next/server';

import { validateCheckoutCoupon } from '@/lib/payments/coupons';
import { TOSSPAY_PLAN_CONFIG } from '@/lib/plans/config';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { couponCode, context } = body as {
      couponCode?: string;
      context?: string;
    };

    if (context !== 'allinone') {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 쿠폰 대상입니다.' },
        { status: 400 },
      );
    }

    const result = await validateCheckoutCoupon({
      couponCode,
      context: 'allinone',
      originalAmount: TOSSPAY_PLAN_CONFIG.allinone.amount,
      userId: user.id,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message, reason: result.reason },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: result.coupon.code,
        label: result.coupon.label,
        description: result.coupon.description,
        discountAmount: result.discountAmount,
        originalAmount: result.originalAmount,
        finalAmount: result.finalAmount,
        expiresAt: result.coupon.expiresAt || null,
      },
    });
  } catch (error) {
    console.error('[Coupon Validate] Error:', error);
    return NextResponse.json(
      { success: false, error: '쿠폰 확인에 실패했습니다.' },
      { status: 500 },
    );
  }
}
