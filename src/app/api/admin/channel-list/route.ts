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

// POST: 채널 추가 (upsert)
export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { id, month, title, subscriber_count, avg_view_count, median_views, category, subcategory, format, channel_url } = body;

  if (!id || !title || !month) {
    return NextResponse.json({ error: "ID, 채널명, 월은 필수입니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("channel_list")
    .upsert({
      id,
      month,
      title,
      subscriber_count: subscriber_count || 0,
      avg_view_count: avg_view_count || 0,
      median_views: median_views || 0,
      category: category || "",
      subcategory: subcategory || "",
      format: format || "",
      channel_url: channel_url || "",
    }, { onConflict: "id" })
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
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("channel_list")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

// DELETE: 채널 삭제 (개별 id 또는 월별 month)
export async function DELETE(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const month = searchParams.get("month");

  if (!id && !month) {
    return NextResponse.json({ error: "ID 또는 월(month)이 필요합니다." }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (month) {
    // 월별 일괄 삭제
    const { error } = await supabase.from("channel_list").delete().eq("month", month);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, deleted: "month", month });
  }

  // 개별 삭제
  const { error } = await supabase.from("channel_list").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
