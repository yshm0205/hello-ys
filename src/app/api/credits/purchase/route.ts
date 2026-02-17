/**
 * Credits Purchase API Route
 * 크레딧 추가팩 구매 처리
 * - 포트원 결제 검증 후 크레딧 추가
 * - TODO: 포트원 연동 시 결제 검증 로직 추가
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
        const packSize = body.pack as number;
        const paymentId = body.payment_id as string; // 포트원 결제 ID

        const pack = packSize ? CREDIT_PACKS[packSize] : undefined;
        if (!pack) {
            return NextResponse.json(
                { success: false, error: `존재하지 않는 팩: ${packSize}` },
                { status: 400 }
            );
        }

        // 3. TODO: 포트원 결제 검증
        // - paymentId로 포트원 API 호출 → 결제 금액 검증
        // - pack.price와 실제 결제 금액 일치 확인
        // - 이미 처리된 결제인지 중복 확인
        if (!paymentId) {
            return NextResponse.json(
                { success: false, error: "결제 기능 준비 중입니다. 곧 오픈 예정이에요!" },
                { status: 503 }
            );
        }

        // 4. 크레딧 추가
        const adminClient = createAdminClient();

        // 현재 크레딧 조회
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
            .eq("credits", currentCredits) // 낙관적 동시성
            .select("credits")
            .single();

        if (updateError || !updated) {
            return NextResponse.json(
                { success: false, error: "충전 처리 중 오류가 발생했습니다. 다시 시도해주세요." },
                { status: 409 }
            );
        }

        // 5. TODO: 결제 이력 저장 (payment_history 테이블)

        return NextResponse.json({
            success: true,
            credits: updated.credits,
            added: pack.credits,
            message: `${pack.credits}cr 충전 완료! (잔여: ${updated.credits}cr)`,
        });

    } catch (error) {
        console.error("[Credits Purchase API] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
