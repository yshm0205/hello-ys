import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim());

function isMissingFirstUploadColumn(error: { message?: string; code?: string } | null) {
  return Boolean(
    error &&
      (error.code === "42703" ||
        error.message?.includes("first_upload_date") ||
        error.message?.includes("schema cache")),
  );
}

function normalizeDateInput(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const compact = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;

  const separated = raw.match(/^(\d{4})[./-](\d{1,2})(?:[./-](\d{1,2}))?$/);
  if (!separated) return null;

  const [, year, month, day = "1"] = separated;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

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
  const { id, month, title, subscriber_count, avg_view_count, median_views, category, subcategory, format, channel_url, first_upload_date } = body;

  if (!id || !title || !month) {
    return NextResponse.json({ error: "ID, 채널명, 월은 필수입니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const basePayload = {
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
  };

  let { data, error } = await supabase
    .from("channel_list")
    .upsert({
      ...basePayload,
      first_upload_date: normalizeDateInput(first_upload_date),
    }, { onConflict: "id" })
    .select()
    .single();

  if (isMissingFirstUploadColumn(error)) {
    const fallback = await supabase
      .from("channel_list")
      .upsert(basePayload, { onConflict: "id" })
      .select()
      .single();

    data = fallback.data;
    error = fallback.error;
  }

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
  if ("first_upload_date" in updates) {
    updates.first_upload_date = normalizeDateInput(updates.first_upload_date);
  }
  let { data, error } = await supabase
    .from("channel_list")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (isMissingFirstUploadColumn(error)) {
    const fallbackUpdates = { ...updates };
    delete fallbackUpdates.first_upload_date;
    const fallback = await supabase
      .from("channel_list")
      .update(fallbackUpdates)
      .eq("id", id)
      .select()
      .single();

    data = fallback.data;
    error = fallback.error;
  }

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
