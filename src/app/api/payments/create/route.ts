import { NextRequest, NextResponse } from "next/server";

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
    const packCredits = Number(body.pack);
    const pack = CREDIT_TOPUP_PACKS.find((candidate) => candidate.credits === packCredits);

    if (!pack) {
      return NextResponse.json(
        { success: false, error: `유효하지 않은 크레딧 팩입니다. ${body.pack}` },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
    const orderId = `credit_${user.id.slice(0, 8)}_${Date.now()}`;
    const orderName = `FlowSpot 크레딧 ${pack.credits}cr`;
    const pendingPaymentKey = `pending:${orderId}`;
    const now = new Date().toISOString();

    const { error: insertError } = await adminClient.from("toss_payments").insert({
      user_id: user.id,
      payment_key: pendingPaymentKey,
      order_id: orderId,
      order_name: orderName,
      amount: pack.amount,
      credits: pack.credits,
      status: "PENDING",
      metadata: {
        paymentKind: "credit_topup",
        packCredits: pack.credits,
        pendingPaymentKey,
        createdAt: now,
      },
      updated_at: now,
    });

    if (insertError) {
      console.error("[Payments Create] Failed to persist pending order:", insertError);
      return NextResponse.json(
        { success: false, error: "결제 주문 생성에 실패했습니다. 다시 시도해 주세요." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderName,
      amount: pack.amount,
      credits: pack.credits,
    });
  } catch (error) {
    console.error("[Payments Create] Error:", error);
    return NextResponse.json(
      { success: false, error: "결제 주문 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
