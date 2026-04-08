/**
 * 채널 리스트 공개 API
 * GET /api/hot-channels?month=2026-02 - 월별 채널 목록 조회
 * GET /api/hot-channels/months - 사용 가능한 월 목록
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ months: [], channels: [], total: 0 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const month = request.nextUrl.searchParams.get("month");

  // 사용 가능한 월 목록 조회
  const { data: monthRows } = await supabase
    .from("hot_channels")
    .select("month")
    .neq("month", "")
    .order("month", { ascending: false });

  const months = [...new Set((monthRows || []).map((r) => r.month))];

  // 월 선택: 파라미터 없으면 최신 월
  const selectedMonth = month && months.includes(month) ? month : months[0] || "";

  if (!selectedMonth) {
    return NextResponse.json({ months: [], channels: [], total: 0 });
  }

  const { data, error } = await supabase
    .from("hot_channels")
    .select(
      "channel_id, title, subscriber_count, avg_view_count, median_views, category, subcategory, format, channel_url, updated_at"
    )
    .eq("month", selectedMonth)
    .order("avg_view_count", { ascending: false });

  if (error) {
    console.error("hot-channels API error:", error);
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
  }));

  return NextResponse.json({
    months,
    month: selectedMonth,
    channels,
    total: channels.length,
  });
}
