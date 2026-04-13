import { createClient } from "@/utils/supabase/server";
import { isActiveAccessPlan } from "@/lib/plans/config";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: plan } = await supabase
            .from("user_plans")
            .select("plan_type, expires_at")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!isActiveAccessPlan(plan?.plan_type, plan?.expires_at)) {
            return NextResponse.json({ error: "Lecture access requires an active program." }, { status: 403 });
        }

        const vodId = request.nextUrl.searchParams.get("vodId");
        if (!vodId) {
            return NextResponse.json({ error: "vodId required" }, { status: 400 });
        }
        if (!/^vod_\d{2}$/.test(vodId)) {
            return NextResponse.json({ error: "Invalid vodId" }, { status: 400 });
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
