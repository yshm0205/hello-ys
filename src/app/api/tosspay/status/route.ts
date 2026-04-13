import { NextRequest, NextResponse } from "next/server";

import { TOSSPAY_PLAN_CONFIG } from "@/lib/tosspay/config";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const orderNo = request.nextUrl.searchParams.get("orderNo");
    if (!orderNo) {
      return NextResponse.json({ error: "orderNo가 필요합니다." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: payment, error } = await admin
      .from("toss_payments")
      .select("order_id, order_name, amount, credits, status, metadata, updated_at")
      .eq("order_id", orderNo)
      .eq("user_id", user.id)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: "주문을 찾지 못했습니다." }, { status: 404 });
    }

    const planType =
      typeof payment.metadata?.planType === "string"
        ? payment.metadata.planType
        : null;
    const plan =
      planType && planType in TOSSPAY_PLAN_CONFIG
        ? TOSSPAY_PLAN_CONFIG[planType as keyof typeof TOSSPAY_PLAN_CONFIG]
        : null;

    return NextResponse.json({
      success: true,
      status: payment.status,
      orderId: payment.order_id,
      orderName: payment.order_name,
      amount: payment.amount,
      addedCredits: payment.credits || plan?.credits || 0,
      planType,
      updatedAt: payment.updated_at,
    });
  } catch (error) {
    console.error("[TossPay Status] Error:", error);
    return NextResponse.json(
      { error: "결제 상태를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
