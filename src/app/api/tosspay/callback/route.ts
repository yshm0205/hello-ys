import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { recordCreditTransaction } from "@/lib/credits/server";

/**
 * 토스페이 결제 결과 콜백 (V2 JSON)
 * autoExecute=true이므로 결제 완료 시 토스가 이 URL을 호출
 */

// 플랜별 설정
const PLAN_CONFIG: Record<string, { credits: number; months: number; creditsPerMonth: number }> = {
    allinone: { credits: 160, months: 4, creditsPerMonth: 40 },
    // 나중에 추가
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { orderNo, payToken, status, amount } = body as {
            orderNo?: string;
            payToken?: string;
            status?: string;
            amount?: number;
        };

        console.log("[TossPay Callback]", JSON.stringify(body));

        if (!orderNo) {
            return NextResponse.json({ code: 0 });
        }

        const admin = createAdminClient();

        // 주문 정보 조회
        const { data: payment } = await admin
            .from("toss_payments")
            .select("*")
            .eq("order_id", orderNo)
            .single();

        if (!payment) {
            console.error("[TossPay Callback] Order not found:", orderNo);
            return NextResponse.json({ code: 0 });
        }

        // 이미 처리된 결제면 스킵
        if (payment.status === "DONE") {
            return NextResponse.json({ code: 0 });
        }

        // 결제 실패
        if (status !== "PAY_COMPLETE") {
            await admin
                .from("toss_payments")
                .update({ status: status || "FAILED", updated_at: new Date().toISOString() })
                .eq("order_id", orderNo);
            return NextResponse.json({ code: 0 });
        }

        // 금액 검증
        if (amount !== payment.amount) {
            console.error("[TossPay Callback] Amount mismatch:", { expected: payment.amount, got: amount });
            await admin
                .from("toss_payments")
                .update({ status: "AMOUNT_MISMATCH" })
                .eq("order_id", orderNo);
            return NextResponse.json({ code: 0 });
        }

        // 플랜 설정 가져오기
        const planType = payment.metadata?.planType || "allinone";
        const config = PLAN_CONFIG[planType];
        if (!config) {
            console.error("[TossPay Callback] Unknown plan:", planType);
            return NextResponse.json({ code: 0 });
        }

        // user_plans 업데이트
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + config.months);

        const { data: plan } = await admin
            .from("user_plans")
            .select("credits")
            .eq("user_id", payment.user_id)
            .single();

        const currentCredits = plan?.credits || 0;
        const newCredits = currentCredits + config.credits;

        await admin
            .from("user_plans")
            .update({
                plan_type: planType,
                credits: newCredits,
                expires_at: expiresAt.toISOString(),
            })
            .eq("user_id", payment.user_id);

        // toss_payments 상태 업데이트
        await admin
            .from("toss_payments")
            .update({
                status: "DONE",
                payment_key: payToken,
                updated_at: new Date().toISOString(),
            })
            .eq("order_id", orderNo);

        // 크레딧 트랜잭션 기록
        await recordCreditTransaction({
            userId: payment.user_id,
            type: "charge",
            amount: config.credits,
            balanceAfter: newCredits,
            description: `토스페이 결제: ${planType} (${config.months}개월)`,
            referenceId: orderNo,
            metadata: { provider: "tosspay", planType, payToken, amount },
        });

        console.log("[TossPay Callback] Success:", { orderNo, planType, credits: config.credits });
        return NextResponse.json({ code: 0 });
    } catch (error) {
        console.error("[TossPay Callback] Error:", error);
        return NextResponse.json({ code: 0 });
    }
}
