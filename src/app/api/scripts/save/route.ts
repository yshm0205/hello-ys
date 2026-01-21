/**
 * Script Save API Route
 * 생성된 스크립트를 DB에 저장
 */

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 로그인 필수 - 게스트는 저장 불가
        if (!user) {
            return NextResponse.json(
                { error: "스크립트를 저장하려면 로그인이 필요합니다." },
                { status: 401 }
            );
        }

        const userId = user.id;

        const body = await request.json();
        const { input_text, scripts, selected_script } = body;

        if (!input_text) {
            return NextResponse.json(
                { error: "입력 텍스트가 필요합니다." },
                { status: 400 }
            );
        }

        // 스크립트 데이터 준비
        const scriptData = scripts || (selected_script ? [selected_script] : []);

        // DB에 저장
        const { data, error } = await supabase
            .from("script_generations")
            .insert({
                user_id: userId,
                input_text: input_text.substring(0, 1000), // 최대 1000자
                scripts: scriptData,
            })
            .select()
            .single();

        if (error) {
            console.error("[Script Save API] DB Error:", error);
            return NextResponse.json(
                { error: "저장에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            id: data.id,
            message: "스크립트가 저장되었습니다!",
        });

    } catch (error) {
        console.error("[Script Save API] Error:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
