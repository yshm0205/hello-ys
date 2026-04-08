import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return null;
  }

  return user;
}

function normalizePayload(body: Record<string, unknown>) {
  return {
    date: body.date,
    video_id: body.video_id,
    rank: body.rank || 0,
    view_count: body.view_count || 0,
    subscriber_count: body.subscriber_count || 0,
    avg_channel_views: body.avg_channel_views || 0,
    contribution_rate: body.contribution_rate || 0,
    performance_rate: body.performance_rate || 0,
    view_velocity: body.view_velocity || 0,
    engagement_rate: body.engagement_rate || 0,
    score: body.score || 0,
    reason_flags: Array.isArray(body.reason_flags) ? body.reason_flags : [],
  };
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const payload = normalizePayload(body);

  if (!payload.date || !payload.video_id) {
    return NextResponse.json(
      { error: "date and video_id are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("hot_list_daily")
    .upsert(payload, { onConflict: "date,video_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function PUT(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const payload = normalizePayload(body);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("hot_list_daily")
    .update(payload)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("hot_list_daily").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
