/**
 * 토스페이먼츠 결제 승인 API
 * - 클라이언트에서 paymentKey, orderId, amount를 받아
 * - 토스 결제 승인 API 호출 → 크레딧 추가
 */

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const CREDIT_PACKS: Record<number, { credits: number; price: number }> = {
    100: { credits: 100, price: 14900 },
    300: { credits: 300, price: 34900 },
    500: { credits: 500, price: 54900 },
    1000: { credits: 1000, price: 99900 },
};

export async function POST(request: NextRequest) {
    try {
        // 1. 인증
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "로그인이 필요합니다." },
                { status: 401 }
            );
        }

        // 2. 요청 파싱
        const body = await request.json().catch(() => ({}));
        const { paymentKey, orderId, amount } = body as {
            paymentKey?: string;
            orderId?: string;
            amount?: number;
        };

        if (!paymentKey || !orderId || !amount) {
            return NextResponse.json(
                { success: false, error: "필수 파라미터가 누락되었습니다." },
                { status: 400 }
            );
        }

        // 3. amount로 팩 찾기
        const pack = Object.values(CREDIT_PACKS).find(p => p.price === amount);
        if (!pack) {
            return NextResponse.json(
                { success: false, error: `유효하지 않은 결제 금액: ${amount}` },
                { status: 400 }
            );
        }

        // 4. 토스페이먼츠 결제 승인
        const secretKey = process.env.TOSS_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json(
                { success: false, error: "결제 설정 오류" },
                { status: 500 }
            );
        }

        const encryptedSecretKey = "Basic " + Buffer.from(secretKey + ":").toString("base64");

        const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
            method: "POST",
            headers: {
                Authorization: encryptedSecretKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        const tossData = await tossRes.json();

        if (!tossRes.ok) {
            console.error("[Payments Confirm] 토스 승인 실패:", tossData);
            return NextResponse.json(
                { success: false, error: tossData.message || "결제 승인에 실패했습니다." },
                { status: 400 }
            );
        }

        // 5. 크레딧 추가
        const adminClient = createAdminClient();

        const { data: plan } = await supabase
            .from("user_plans")
            .select("credits")
            .eq("user_id", user.id)
            .single();

        const currentCredits = plan?.credits || 0;

        const { data: updated, error: updateError } = await adminClient
            .from("user_plans")
            .update({ credits: currentCredits + pack.credits })
            .eq("user_id", user.id)
            .eq("credits", currentCredits)
            .select("credits")
            .single();

        if (updateError || !updated) {
            console.error("[Payments Confirm] 크레딧 업데이트 실패:", updateError);
            return NextResponse.json(
                { success: false, error: "크레딧 충전 중 오류가 발생했습니다. 고객센터에 문의해주세요." },
                { status: 409 }
            );
        }

        return NextResponse.json({
            success: true,
            credits: updated.credits,
            added: pack.credits,
            orderId: tossData.orderId,
        });

    } catch (error) {
        console.error("[Payments Confirm] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
