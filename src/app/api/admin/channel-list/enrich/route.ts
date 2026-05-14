import { NextRequest, NextResponse } from "next/server";

import { fetchYoutubeChannelMetadata } from "@/lib/youtube/channel-metadata";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim());

type ChannelListRow = {
  id: string;
  title: string;
  channel_url: string | null;
  subscriber_count: number | null;
  first_upload_date: string | null;
  profile_image_url: string | null;
  total_video_count: number | null;
};

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return null;
  return user;
}

function needsEnrichment(row: ChannelListRow) {
  return Boolean(
    row.channel_url &&
      (!row.first_upload_date || !row.profile_image_url || !row.total_video_count),
  );
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const month = typeof body.month === "string" ? body.month : "";
  const limit =
    typeof body.limit === "number" && body.limit > 0
      ? Math.min(Math.floor(body.limit), 10)
      : 5;

  if (!month) {
    return NextResponse.json({ error: "month is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("channel_list")
    .select("id, title, channel_url, subscriber_count, first_upload_date, profile_image_url, total_video_count")
    .eq("month", month)
    .order("avg_view_count", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const missingRows = ((data as ChannelListRow[]) || []).filter(needsEnrichment);
  const targetRows = missingRows.slice(0, limit);
  let updated = 0;
  let failed = 0;

  for (const row of targetRows) {
    const metadata = await fetchYoutubeChannelMetadata(row.channel_url || "", row.title || "");
    if (!metadata) {
      failed += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("channel_list")
      .update({
        subscriber_count: row.subscriber_count || metadata.subscriberCount,
        first_upload_date: row.first_upload_date || metadata.firstUploadDate,
        profile_image_url: row.profile_image_url || metadata.profileImageUrl,
        total_video_count: row.total_video_count || metadata.totalVideoCount,
      })
      .eq("id", row.id);

    if (updateError) {
      failed += 1;
    } else {
      updated += 1;
    }
  }

  return NextResponse.json({
    success: true,
    updated,
    failed,
    remaining: Math.max(0, missingRows.length - targetRows.length),
    totalMissing: missingRows.length,
  });
}
