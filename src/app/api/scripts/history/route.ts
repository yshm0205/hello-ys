/**
 * Script History API Route
 * 사용자의 스크립트 생성 기록 조회/수정/삭제
 */

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET: 스크립트 목록 조회
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            );
        }

        // script_generations 테이블에서 사용자의 스크립트 조회
        const { data: scripts, error } = await supabase
            .from("script_generations")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[Scripts API] DB Error:", error);
            return NextResponse.json(
                { error: "스크립트 조회에 실패했습니다." },
                { status: 500 }
            );
        }

        // 데이터 형식 변환
        const formattedScripts = scripts?.map((item) => ({
            id: item.id,
            title: item.input_text?.substring(0, 30) + "..." || "제목 없음",
            inputText: item.input_text || "",
            scripts: item.scripts || [],
            createdAt: new Date(item.created_at).toLocaleString("ko-KR"),
            archetype: item.scripts?.[0]?.archetype || "UNKNOWN",
            versions: item.scripts?.length || 0,
        })) || [];

        return NextResponse.json({
            success: true,
            scripts: formattedScripts,
        });

    } catch (error) {
        console.error("[Scripts API] Error:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// DELETE: 스크립트 삭제
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            );
        }

        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: "삭제할 스크립트 ID가 필요합니다." },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from("script_generations")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("[Scripts API] Delete Error:", error);
            return NextResponse.json(
                { error: "삭제에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[Scripts API] Error:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// PUT: 스크립트 수정
export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            );
        }

        const { id, scripts } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: "수정할 스크립트 ID가 필요합니다." },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from("script_generations")
            .update({ scripts })
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("[Scripts API] Update Error:", error);
            return NextResponse.json(
                { error: "수정에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[Scripts API] Error:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
