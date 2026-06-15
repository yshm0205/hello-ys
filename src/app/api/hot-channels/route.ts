/**
 * 채널 리스트 공개 API (channel_list 테이블)
 * GET /api/hot-channels?month=2026-02
 */

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getActiveChallengeEnrollment } from "@/lib/challenge/access";
import { isActiveAccessPlan } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const CHALLENGE_HOT_LIST_MONTH = "2026-01";
const LOCKED_MONTH_PREVIEW_COUNT = 5;

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
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다.", months: [], channels: [], total: 0 },
      { status: 401 },
    );
  }

  const plan = await getEffectiveCreditInfo(user.id);
  const hasFullAccess = isActiveAccessPlan(plan?.plan_type, plan?.expires_at);
  const challengeEnrollment = hasFullAccess ? null : await getActiveChallengeEnrollment(user.id);
  const hasChallengeAccess = Boolean(challengeEnrollment);

  if (!hasFullAccess && !hasChallengeAccess) {
    return NextResponse.json(
      { error: "채널 리스트 권한이 없습니다.", months: [], channels: [], total: 0 },
      { status: 403 },
    );
  }

  const supabase = createAdminClient();
  const month = request.nextUrl.searchParams.get("month");

  // 사용 가능한 월 목록
  const months = await getAvailableMonths(supabase);
  const defaultMonth = hasFullAccess ? months[0] || "" : CHALLENGE_HOT_LIST_MONTH;
  const selectedMonth = month && months.includes(month) ? month : defaultMonth;
  const isLockedMonth = hasChallengeAccess && !hasFullAccess && selectedMonth !== CHALLENGE_HOT_LIST_MONTH;

  if (!selectedMonth) {
    return NextResponse.json({ months: [], channels: [], total: 0 });
  }

  let query = supabase
    .from("channel_list")
    .select(
      "title, subscriber_count, avg_view_count, median_views, category, subcategory, format, channel_url, first_upload_date, profile_image_url, total_video_count",
      { count: "exact" },
    )
    .eq("month", selectedMonth)
    .order("avg_view_count", { ascending: false });

  if (isLockedMonth) {
    query = query.limit(LOCKED_MONTH_PREVIEW_COUNT);
  }

  const result = await query;
  let data = result.data as ChannelListRow[] | null;
  let error = result.error;
  let total = result.count ?? data?.length ?? 0;

  if (isMissingChannelMetaColumn(error)) {
    let fallbackQuery = supabase
      .from("channel_list")
      .select("title, subscriber_count, avg_view_count, median_views, category, subcategory, format, channel_url", {
        count: "exact",
      })
      .eq("month", selectedMonth)
      .order("avg_view_count", { ascending: false });

    if (isLockedMonth) {
      fallbackQuery = fallbackQuery.limit(LOCKED_MONTH_PREVIEW_COUNT);
    }

    const fallback = await fallbackQuery;

    data = fallback.data as ChannelListRow[] | null;
    error = fallback.error;
    total = fallback.count ?? data?.length ?? 0;
  }

  if (error) {
    return NextResponse.json({ months, month: selectedMonth, channels: [], total: 0, locked: isLockedMonth });
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
    total,
    locked: isLockedMonth,
    lockMessage: isLockedMonth
      ? "최신월과 전체 Hot 리스트는 올인원 패스 구매자 전용입니다. 챌린지에서는 1월 리스트만 열람할 수 있습니다."
      : null,
  });
}
