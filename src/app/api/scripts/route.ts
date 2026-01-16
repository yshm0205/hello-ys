/**
 * Script Generator API Route
 * Next.js에서 Render Python API를 호출하는 프록시
 */

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Render API URL
const RENDER_API_URL = process.env.SCRIPT_GENERATOR_API_URL || "https://script-generator-api.onrender.com";

export async function POST(request: Request) {
    try {
        // 1. 인증 확인
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        // [임시] 로그인 체크 비활성화 - 나중에 원복 필요
        // if (!authUser) {
        //     return NextResponse.json(
        //         { error: "로그인이 필요합니다." },
        //         { status: 401 }
        //     );
        // }

        // 게스트 사용자 처리
        const user = authUser || { id: "guest_user" };
        const isGuest = !authUser;

        // 2. 구독 상태 확인 (선택적) - 게스트는 스킵
        let subscription = null;
        if (!isGuest) {
            try {
                const { data } = await supabase
                    .from("subscriptions")
                    .select("*")
                    .eq("user_id", user.id)
                    .single();
                subscription = data;
            } catch {
                // 구독 정보 없어도 진행
            }
        }

        // Pro 플랜이 아니면 제한 (필요시 활성화)
        // if (!subscription || subscription.plan_name !== "Pro") {
        //   return NextResponse.json(
        //     { error: "Pro 플랜이 필요합니다." },
        //     { status: 403 }
        //   );
        // }

        // 3. 요청 본문 파싱
        const body = await request.json();
        const { reference_script, num_scripts = 3 } = body;

        if (!reference_script || reference_script.length < 50) {
            return NextResponse.json(
                { error: "참고 스크립트가 너무 짧습니다. 최소 50자 이상 입력해주세요." },
                { status: 400 }
            );
        }

        // 4. Render Python API 호출
        const response = await fetch(`${RENDER_API_URL}/api/generate-script`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                reference_script,
                user_id: user.id,
                num_scripts,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[Script API] Render error:", error);
            return NextResponse.json(
                { error: "스크립트 생성에 실패했습니다." },
                { status: 500 }
            );
        }

        const result = await response.json();

        // 5. 생성 기록 저장 (선택적) - 게스트는 스킵
        if (!isGuest && result.success && result.scripts?.length > 0) {
            try {
                await supabase.from("script_generations").insert({
                    user_id: user.id,
                    input_text: reference_script.substring(0, 500),
                    scripts: result.scripts,
                    token_usage: result.token_usage,
                });
            } catch {
                // DB 저장 실패해도 결과는 반환
            }
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error("[Script API] Error:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

