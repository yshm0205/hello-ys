/**
 * Credits API Route
 * 사용자 크레딧 잔량 조회
 * - user_plans 행 없으면 free/30cr 자동 생성 (무료 체험)
 */

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "크레딧을 조회하려면 로그인이 필요합니다." },
                { status: 401 }
            );
        }

        // user_plans 테이블에서 크레딧 정보 조회
        const { data, error } = await supabase
            .from("user_plans")
            .select(
                "credits, plan_type, expires_at, monthly_credit_amount, monthly_credit_total_cycles, monthly_credit_granted_cycles, next_credit_at",
            )
            .eq("user_id", user.id)
            .single();

        // 행이 없으면 무료 체험 자동 생성 (30cr)
        if (error || !data) {
            const adminClient = createAdminClient();
            const { data: created, error: createError } = await adminClient
                .from("user_plans")
                .insert({
                    user_id: user.id,
                    plan_type: "free",
                    credits: 30,
                })
                .select(
                    "credits, plan_type, expires_at, monthly_credit_amount, monthly_credit_total_cycles, monthly_credit_granted_cycles, next_credit_at",
                )
                .single();

            if (createError || !created) {
                // 이미 다른 요청에서 생성됨 → 재조회
                const { data: retry } = await supabase
                    .from("user_plans")
                    .select(
                        "credits, plan_type, expires_at, monthly_credit_amount, monthly_credit_total_cycles, monthly_credit_granted_cycles, next_credit_at",
                    )
                    .eq("user_id", user.id)
                    .single();

                if (retry) {
                    return NextResponse.json(retry);
                }

                return NextResponse.json({
                    credits: 30,
                    plan_type: "free",
                    expires_at: null,
                    monthly_credit_amount: 0,
                    monthly_credit_total_cycles: null,
                    monthly_credit_granted_cycles: 0,
                    next_credit_at: null,
                });
            }

            return NextResponse.json({
                credits: created.credits,
                plan_type: created.plan_type,
                expires_at: created.expires_at,
                monthly_credit_amount: created.monthly_credit_amount ?? 0,
                monthly_credit_total_cycles: created.monthly_credit_total_cycles ?? null,
                monthly_credit_granted_cycles: created.monthly_credit_granted_cycles ?? 0,
                next_credit_at: created.next_credit_at ?? null,
            });
        }

        return NextResponse.json({
            credits: data.credits,
            plan_type: data.plan_type,
            expires_at: data.expires_at,
            monthly_credit_amount: data.monthly_credit_amount ?? 0,
            monthly_credit_total_cycles: data.monthly_credit_total_cycles ?? null,
            monthly_credit_granted_cycles: data.monthly_credit_granted_cycles ?? 0,
            next_credit_at: data.next_credit_at ?? null,
        });

    } catch (error) {
        console.error("[Credits API] Error:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
