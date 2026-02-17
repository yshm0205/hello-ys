/**
 * 임시 크레딧 리셋 API — 테스트 후 삭제 예정
 */
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
        }

        const adminClient = createAdminClient();

        // upsert: 있으면 업데이트, 없으면 생성
        const { data, error } = await adminClient
            .from("user_plans")
            .upsert({
                user_id: user.id,
                credits: 30,
                plan_type: "free",
            }, { onConflict: "user_id" })
            .select("credits, plan_type")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, ...data });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
