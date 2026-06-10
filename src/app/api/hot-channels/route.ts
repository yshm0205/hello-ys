/**
 * 채널 리스트 공개 API (channel_list 테이블)
 * GET /api/hot-channels?month=2026-02
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type ChannelListRow = {
  title: string;
  subscriber_count: number | null;
  avg_view_count: number | null;
  median_views: number | null;
  category: string | null;
  subcategory: string | null;
  format: string | null;
  channel_url: string | null;
  first_upload_date?: string | null;
  profile_image_url?: string | null;
  total_video_count?: number | null;
};

type ChannelMonthRow = {
  month: string | null;
};

const MONTH_LOOKUP_PAGE_SIZE = 1000;

function isMissingChannelMetaColumn(error: { message?: string; code?: string } | null) {
  return Boolean(
    error &&
      (error.code === "42703" ||
        error.message?.includes("first_upload_date") ||
        error.message?.includes("profile_image_url") ||
        error.message?.includes("total_video_count") ||
        error.message?.includes("schema cache")),
  );
}

async function getAvailableMonths(supabase: SupabaseClient) {
  const months = new Set<string>();

  for (let from = 0; ; from += MONTH_LOOKUP_PAGE_SIZE) {
    const to = from + MONTH_LOOKUP_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("channel_list")
      .select("month")
      .order("month", { ascending: false })
      // Supabase REST caps each response at 1,000 rows. Read every page before
      // de-duplicating, otherwise older months can disappear from the list.
      .range(from, to);

    const rows = (data || []) as ChannelMonthRow[];

    if (error || !rows.length) break;

    for (const row of rows) {
      if (row.month) months.add(row.month);
    }

    if (rows.length < MONTH_LOOKUP_PAGE_SIZE) break;
  }

  return [...months];
}

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ months: [], channels: [], total: 0 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const month = request.nextUrl.searchParams.get("month");

  // 사용 가능한 월 목록
  const months = await getAvailableMonths(supabase);
  const selectedMonth = month && months.includes(month) ? month : months[0] || "";

  if (!selectedMonth) {
    return NextResponse.json({ months: [], channels: [], total: 0 });
  }

  const result = await supabase
    .from("channel_list")
    .select("title, subscriber_count, avg_view_count, median_views, category, subcategory, format, channel_url, first_upload_date, profile_image_url, total_video_count")
    .eq("month", selectedMonth)
    .order("avg_view_count", { ascending: false });
  let data = result.data as ChannelListRow[] | null;
  let error = result.error;

  if (isMissingChannelMetaColumn(error)) {
    const fallback = await supabase
      .from("channel_list")
      .select("title, subscriber_count, avg_view_count, median_views, category, subcategory, format, channel_url")
      .eq("month", selectedMonth)
      .order("avg_view_count", { ascending: false });

    data = fallback.data as ChannelListRow[] | null;
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ months, month: selectedMonth, channels: [], total: 0 });
  }

  const channels = (data || []).map((ch) => ({
    name: ch.title,
    subscribers: ch.subscriber_count || 0,
    avg_views: ch.avg_view_count || 0,
    median_views: ch.median_views || 0,
    category: ch.category || "",
    subcategory: ch.subcategory || "",
    format: ch.format || "",
    channel_url: ch.channel_url || "",
    first_upload_date: "first_upload_date" in ch ? ch.first_upload_date || null : null,
    profile_image_url: "profile_image_url" in ch ? ch.profile_image_url || "" : "",
    total_video_count: "total_video_count" in ch ? ch.total_video_count || 0 : 0,
  }));

  return NextResponse.json({
    months,
    month: selectedMonth,
    channels,
    total: channels.length,
  });
}
