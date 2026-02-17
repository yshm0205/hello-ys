/**
 * Credits Deduct API Route
 * 액션별 크레딧 차감
 * - action: research(3), generate_full(10), generate_skip(7), rewrite(2)
 * - 사전 잔량 체크 → 부족 시 403
 * - 낙관적 동시성 제어
 */

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const CREDIT_COSTS: Record<string, number> = {
    generate_full: 10,   // 리서치 포함 풀 생성
    generate_skip: 7,    // 리서치 스킵 생성
    research: 3,         // 리서치 단독
    rewrite: 2,          // 리라이트
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

        // 2. action 파싱
        const body = await request.json().catch(() => ({}));
        const action = body.action as string;
        const cost = action ? CREDIT_COSTS[action] : undefined;

        if (!cost) {
            return NextResponse.json(
                { success: false, error: `알 수 없는 액션: ${action}` },
                { status: 400 }
            );
        }

        // 3. 플랜 정보 조회
        const { data: plan, error: planError } = await supabase
            .from("user_plans")
            .select("credits, plan_type, expires_at")
            .eq("user_id", user.id)
            .single();

        if (planError || !plan) {
            return NextResponse.json(
                { success: false, error: "플랜 정보가 없습니다. 페이지를 새로고침 해주세요." },
                { status: 403 }
            );
        }

        // 4. 만료일 확인 (pro/allinone)
        if (plan.expires_at && ["pro", "allinone"].includes(plan.plan_type)) {
            const now = new Date();
            const expiresAt = new Date(plan.expires_at);
            if (now > expiresAt) {
                return NextResponse.json(
                    { success: false, error: "이용권이 만료되었습니다. 갱신해주세요." },
                    { status: 403 }
                );
            }
        }

        // 5. 잔량 확인
        if (plan.credits < cost) {
            return NextResponse.json(
                {
                    success: false,
                    credits: plan.credits,
                    error: `크레딧이 부족합니다. (필요: ${cost}cr, 잔여: ${plan.credits}cr)`,
                },
                { status: 403 }
            );
        }

        // 6. 낙관적 동시성 제어로 차감
        const adminClient = createAdminClient();
        const { data: updated, error: updateError } = await adminClient
            .from("user_plans")
            .update({ credits: plan.credits - cost })
            .eq("user_id", user.id)
            .eq("credits", plan.credits)  // 동시성 제어
            .select("credits")
            .single();

        if (updateError || !updated) {
            return NextResponse.json(
                { success: false, error: "동시 요청이 감지되었습니다. 다시 시도해주세요." },
                { status: 409 }
            );
        }

        return NextResponse.json({
            success: true,
            credits: updated.credits,
            deducted: cost,
            message: `${cost}cr 사용 (잔여: ${updated.credits}cr)`,
        });

    } catch (error) {
        console.error("[Credits Deduct API] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
