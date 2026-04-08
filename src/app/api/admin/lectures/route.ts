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

// POST: 강의 추가
export async function POST(request: NextRequest) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { title, description, video_url, thumbnail_url, status, order_index } = body;

    if (!title) {
        return NextResponse.json({ error: "제목은 필수입니다." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("lectures")
        .insert({
            title,
            description: description || null,
            video_url: video_url || null,
            thumbnail_url: thumbnail_url || null,
            status: status || "draft",
            order_index: order_index ?? 0,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
}

// PUT: 강의 수정
export async function PUT(request: NextRequest) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
        return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("lectures")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
}

// DELETE: 강의 삭제
export async function DELETE(request: NextRequest) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("lectures").delete().eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
