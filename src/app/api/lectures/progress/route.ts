import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { data, error } = await supabase
            .from("lecture_progress")
            .select("vod_id, completed_at, last_position")
            .eq("user_id", user.id);
        if (error) {
            console.error("[Lectures API] DB Error:", error);
            return NextResponse.json({ success: true, completedVods: [], positions: {} });
        }
        const completedVods: string[] = [];
        const positions: Record<string, number> = {};
        for (const row of data || []) {
            if (row.completed_at) {
                completedVods.push(row.vod_id);
            }
            if (row.last_position && row.last_position > 0) {
                positions[row.vod_id] = row.last_position;
            }
        }
        return NextResponse.json({ success: true, completedVods, positions });
    } catch (err) {
        console.error("[Lectures API] GET Error:", err);
        return NextResponse.json({ success: true, completedVods: [], positions: {} });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const vodId = body.vod_id;
        if (!vodId || typeof vodId !== "string") {
            return NextResponse.json({ error: "vod_id required" }, { status: 400 });
        }

        const upsertData: Record<string, unknown> = {
            user_id: user.id,
            vod_id: vodId,
        };

        // last_position이 있으면 저장
        if (typeof body.last_position === "number") {
            upsertData.last_position = body.last_position;
        }

        // completed 플래그가 있으면 완료 처리
        if (body.completed) {
            upsertData.completed_at = new Date().toISOString();
        }

        const { error } = await supabase.from("lecture_progress").upsert(
            upsertData,
            { onConflict: "user_id,vod_id" }
        );
        if (error) {
            console.error("[Lectures API] Upsert Error:", error);
            return NextResponse.json({ success: false, error: "Failed to save progress" });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[Lectures API] POST Error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
