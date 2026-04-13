import { NextRequest, NextResponse } from "next/server";
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
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const { planType, amount } = body as { planType?: string; amount?: number };

        if (!planType || !amount) {
            return NextResponse.json({ error: "planType과 amount가 필요합니다." }, { status: 400 });
        }

        const orderId = `flowspot_${user.id.slice(0, 8)}_${Date.now()}`;
        const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://flowspot-kr.vercel.app";

        const tossRes = await fetch(TOSSPAY_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                apiKey: TOSSPAY_API_KEY,
                orderNo: orderId,
                amount,
                amountTaxFree: 0,
                productDesc: `FlowSpot ${planType} 이용권`,
                autoExecute: true,
                resultCallback: `${origin}/api/tosspay/callback`,
                retUrl: `${origin}/ko/dashboard/credits/success?orderNo=${orderId}&planType=${planType}`,
                retCancelUrl: `${origin}/ko/dashboard/credits/fail`,
                callbackVersion: "V2",
            }),
        });

        const tossData: TossPayCreateResponse = await tossRes.json();

        if (tossData.code !== 0 || !tossData.checkoutPage) {
            console.error("[TossPay] Create failed:", tossData);
            return NextResponse.json(
                { error: tossData.msg || "결제 생성에 실패했습니다." },
                { status: 400 },
            );
        }

        // 주문 정보 DB에 저장 (결제 확인 시 대조용)
        const { createAdminClient } = await import("@/utils/supabase/admin");
        const admin = createAdminClient();
        await admin.from("toss_payments").insert({
            user_id: user.id,
            order_id: orderId,
            order_name: `FlowSpot ${planType} 이용권`,
            amount,
            status: "PENDING",
            metadata: { planType, payToken: tossData.payToken },
        });

        return NextResponse.json({
            success: true,
            checkoutPage: tossData.checkoutPage,
            orderId,
            payToken: tossData.payToken,
        });
    } catch (error) {
        console.error("[TossPay Create] Error:", error);
        return NextResponse.json({ error: "결제 생성에 실패했습니다." }, { status: 500 });
    }
}
