import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vodId = request.nextUrl.searchParams.get("vodId");

        let query = supabase
            .from("lecture_materials")
            .select("id, vod_id, title, type, url, file_size, sort_order")
            .order("sort_order", { ascending: true });

        if (vodId) {
            query = query.eq("vod_id", vodId);
        }

        const { data, error } = await query;

        if (error) {
            console.error("[Materials API] DB Error:", error);
            return NextResponse.json({ materials: [] });
        }

        return NextResponse.json({ materials: data || [] });
    } catch (err) {
        console.error("[Materials API] Error:", err);
        return NextResponse.json({ materials: [] });
    }
}
