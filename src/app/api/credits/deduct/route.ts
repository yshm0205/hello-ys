/**
 * Credits Deduct API Route
 * 크레딧 1 차감 (스크립트 생성 시 호출)
 * 5단계 검증: 인증 -> 플랜 확인 -> 만료일 -> 잔량 -> 차감
 */

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        // Step 1: 인증 확인
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            );
        }

        // Step 2: 플랜 정보 조회
        const { data: plan, error: planError } = await supabase
            .from("user_plans")
            .select("credits, plan_type, expires_at")
            .eq("user_id", user.id)
            .single();

        if (planError || !plan) {
            return NextResponse.json(
                { error: "이용권이 없습니다. 플랜을 구매해주세요." },
                { status: 403 }
            );
        }

        // Step 3: 무료 사용자 차단
        if (plan.plan_type === "free") {
            return NextResponse.json(
                { error: "무료 플랜은 크레딧을 사용할 수 없습니다." },
                { status: 403 }
            );
        }

        // Step 4: 만료일 확인
        if (plan.expires_at) {
            const now = new Date();
            const expiresAt = new Date(plan.expires_at);
            if (now > expiresAt) {
                return NextResponse.json(
                    { error: "이용권이 만료되었습니다. 갱신해주세요." },
                    { status: 403 }
                );
            }
        }

        // Step 5: 잔량 확인
        if (plan.credits <= 0) {
            return NextResponse.json(
                { error: "크레딧이 부족합니다." },
                { status: 403 }
            );
        }

        // Step 6: 낙관적 동시성 제어로 크레딧 차감
        const adminClient = createAdminClient();

        const { data: updated, error: updateError } = await adminClient
            .from("user_plans")
            .update({ credits: plan.credits - 1 })
            .eq("user_id", user.id)
            .eq("credits", plan.credits)
            .select("credits")
            .single();

        if (updateError || !updated) {
            return NextResponse.json(
                { error: "동시 요청이 감지되었습니다. 다시 시도해주세요." },
                { status: 409 }
            );
        }

        return NextResponse.json({
            success: true,
            credits: updated.credits,
            message: "크레딧이 차감되었습니다.",
        });

    } catch (error) {
        console.error("[Credits Deduct API] Error:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
