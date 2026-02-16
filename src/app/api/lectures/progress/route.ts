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
            .select("vod_id")
            .eq("user_id", user.id);
        if (error) {
            console.error("[Lectures API] DB Error:", error);
            return NextResponse.json({ success: true, completedVods: [] });
        }
        const completedVods = (data || []).map((row: { vod_id: string }) => row.vod_id);
        return NextResponse.json({ success: true, completedVods });
    } catch (err) {
        console.error("[Lectures API] GET Error:", err);
        return NextResponse.json({ success: true, completedVods: [] });
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
        const { error } = await supabase.from("lecture_progress").upsert(
            { user_id: user.id, vod_id: vodId, completed_at: new Date().toISOString() },
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

