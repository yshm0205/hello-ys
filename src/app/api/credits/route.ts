/**
 * Credits API Route
 * 사용자 크레딧 잔량 조회
 */

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 로그인 필수
        if (!user) {
            return NextResponse.json(
                { error: "크레딧을 조회하려면 로그인이 필요합니다." },
                { status: 401 }
            );
        }

        // user_plans 테이블에서 크레딧 정보 조회
        const { data, error } = await supabase
            .from("user_plans")
            .select("credits, plan_type, expires_at")
            .eq("user_id", user.id)
            .single();

        // 행이 없으면 무료 사용자 기본값 반환
        if (error || !data) {
            return NextResponse.json({
                credits: 0,
                plan_type: "free",
                expires_at: null,
            });
        }

        return NextResponse.json({
            credits: data.credits,
            plan_type: data.plan_type,
            expires_at: data.expires_at,
        });

    } catch (error) {
        console.error("[Credits API] Error:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
