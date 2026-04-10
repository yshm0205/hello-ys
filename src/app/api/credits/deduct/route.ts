/**
 * Credits Deduct API Route
 * 액션별 크레딧 차감
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { deductUserCredits, type CreditAction } from "@/lib/credits/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "로그인이 필요합니다." },
                { status: 401 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const action = body.action as CreditAction | undefined;

        if (!action) {
            return NextResponse.json(
                { success: false, error: "액션이 필요합니다." },
                { status: 400 }
            );
        }

        const result = await deductUserCredits(user.id, action);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    credits: result.credits,
                    error: result.error,
                },
                { status: result.status }
            );
        }

        return NextResponse.json({
            success: true,
            credits: result.credits,
            deducted: result.deducted,
            message: result.message,
        });
    } catch (error) {
        console.error("[Credits Deduct API] Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
