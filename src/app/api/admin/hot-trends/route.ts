import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim());

async function checkAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return null;
    return user;
}

// POST: 채널 추가
export async function POST(request: NextRequest) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { channel_id, title, thumbnail_url, subscriber_count, video_count, total_view_count, avg_view_count, median_views, category, subcategory, format, channel_url, month } = body;

    if (!channel_id || !title) {
        return NextResponse.json({ error: "채널 ID와 채널명은 필수입니다." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("hot_channels")
        .upsert({
            channel_id,
            title,
            thumbnail_url: thumbnail_url || null,
            subscriber_count: subscriber_count || 0,
            video_count: video_count || 0,
            total_view_count: total_view_count || 0,
            avg_view_count: avg_view_count || 0,
            median_views: median_views || 0,
            category: category || "",
            subcategory: subcategory || "",
            format: format || "",
            channel_url: channel_url || "",
            month: month || "",
            updated_at: new Date().toISOString(),
        }, { onConflict: "channel_id" })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
}

// PUT: 채널 수정
export async function PUT(request: NextRequest) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { channel_id, ...updates } = body;

    if (!channel_id) {
        return NextResponse.json({ error: "채널 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("hot_channels")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("channel_id", channel_id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
}

// DELETE: 채널 삭제
export async function DELETE(request: NextRequest) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "채널 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("hot_channels").delete().eq("channel_id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
