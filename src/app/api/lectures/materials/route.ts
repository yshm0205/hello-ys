import { createClient } from "@/utils/supabase/server";
import { canAccessLectureVod } from "@/lib/challenge/access";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vodId = request.nextUrl.searchParams.get("vodId");
        if (!vodId) {
            return NextResponse.json({ error: "vodId required" }, { status: 400 });
        }
        if (!/^vod_\d{2}$/.test(vodId)) {
            return NextResponse.json({ error: "Invalid vodId" }, { status: 400 });
        }

        const plan = await getEffectiveCreditInfo(user.id);
        const canAccess = await canAccessLectureVod(user.id, plan, vodId);

        if (!canAccess) {
            return NextResponse.json(
                { error: "Lecture access requires an active program or challenge permission." },
                { status: 403 },
            );
        }

        const { data, error } = await supabase
            .from("lecture_materials")
            .select("id, vod_id, title, type, url, file_size, sort_order")
            .eq("vod_id", vodId)
            .order("sort_order", { ascending: true });

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
