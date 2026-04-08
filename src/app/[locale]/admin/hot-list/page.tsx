import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTranslations } from "next-intl/server";
import {
  Flame,
  Database,
  Users,
  CalendarDays,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { HotListTriggerButton } from "@/components/admin/HotListTriggerButton";
import {
  AddHotChannelButton,
  EditHotChannelButton,
  DeleteHotChannelButton,
} from "@/components/admin/HotTrendForm";
import {
  AddHotListDailyButton,
  DeleteHotListDailyButton,
  EditHotListDailyButton,
} from "@/components/admin/HotListDailyForm";

interface HotChannel {
  channel_id: string;
  title: string;
  thumbnail_url: string | null;
  subscriber_count: number;
  video_count: number;
  total_view_count: number;
  avg_view_count: number;
  updated_at: string | null;
}

interface HotVideo {
  video_id: string;
  channel_id: string | null;
  title: string;
  thumbnail_url: string | null;
}

interface HotListDailyRecord {
  id: string;
  date: string;
  video_id: string;
  rank: number | null;
  view_count: number;
  subscriber_count: number;
  avg_channel_views: number;
  contribution_rate: number;
  performance_rate: number;
  view_velocity: number;
  engagement_rate: number;
  score: number;
  reason_flags: string[] | null;
}

interface EnrichedHotListDailyRecord extends HotListDailyRecord {
  video: HotVideo | null;
  channel: HotChannel | null;
}

interface DailyDateSummary {
  date: string;
  count: number;
}

async function getHotChannels(filters?: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = createAdminClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("hot_channels")
    .select("*", { count: "exact" })
    .order("avg_view_count", { ascending: false });

  if (filters?.q) {
    query = query.or(
      `title.ilike.%${filters.q}%,channel_id.ilike.%${filters.q}%`
    );
  }

  const { data, count } = await query.range(from, to);

  return {
    data: ((data as HotChannel[]) || []),
    totalItems: count || 0,
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  };
}

async function getDailyDates() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("hot_list_daily")
    .select("date")
    .order("date", { ascending: false });

  const counts = new Map<string, number>();
  for (const row of data || []) {
    counts.set(row.date, (counts.get(row.date) || 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({
    date,
    count,
  })) as DailyDateSummary[];
}

async function getDailyEntries(date: string | null) {
  if (!date) {
    return [] as EnrichedHotListDailyRecord[];
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("hot_list_daily")
    .select("*")
    .eq("date", date)
    .order("rank", { ascending: true })
    .limit(100);

  const rows = ((data as HotListDailyRecord[]) || []);
  const videoIds = rows.map((row) => row.video_id);

  const { data: videosData } = videoIds.length
    ? await supabase
        .from("hot_videos")
        .select("video_id, channel_id, title, thumbnail_url")
        .in("video_id", videoIds)
    : { data: [] };

  const videos = (videosData || []) as HotVideo[];
  const videoMap = new Map(videos.map((video) => [video.video_id, video]));

  const channelIds = Array.from(
    new Set(videos.map((video) => video.channel_id).filter(Boolean))
  ) as string[];

  const { data: channelsData } = channelIds.length
    ? await supabase
        .from("hot_channels")
        .select(
          "channel_id, title, thumbnail_url, subscriber_count, video_count, total_view_count, avg_view_count, updated_at"
        )
        .in("channel_id", channelIds)
    : { data: [] };

  const channels = (channelsData || []) as HotChannel[];
  const channelMap = new Map(channels.map((channel) => [channel.channel_id, channel]));

  return rows.map((row) => {
    const video = videoMap.get(row.video_id) || null;
    const channel = video?.channel_id ? channelMap.get(video.channel_id) || null : null;

    return {
      ...row,
      reason_flags: Array.isArray(row.reason_flags) ? row.reason_flags : [],
      video,
      channel,
    };
  });
}

function formatNumber(value: number | null | undefined) {
  return (value || 0).toLocaleString("ko-KR");
}

function buildQueryString(
  current: { q?: string; page?: string; date?: string },
  next: Partial<{ q?: string; page?: string; date?: string }>
) {
  const params = new URLSearchParams();
  const merged = { ...current, ...next };

  if (merged.q) params.set("q", merged.q);
  if (merged.page) params.set("page", merged.page);
  if (merged.date) params.set("date", merged.date);

  return params.toString();
}

export default async function AdminHotListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; date?: string }>;
}) {
  const { q, page, date } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const t = await getTranslations("Admin.hotList");

  const [hotList, dailyDates] = await Promise.all([
    getHotChannels({ q, page: currentPage }),
    getDailyDates(),
  ]);

  const selectedDate =
    date && dailyDates.some((item) => item.date === date)
      ? date
      : dailyDates[0]?.date || null;
  const dailyEntries = await getDailyEntries(selectedDate);
  const latestDate = dailyDates[0]?.date || null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            채널 캐시와 홈페이지용 날짜별 HOT 랭킹을 함께 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddHotChannelButton />
          <HotListTriggerButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 채널</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hotList.totalItems.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">채널 페이지</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentPage} / {hotList.totalPages}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">수집 날짜</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyDates.length}</div>
            <p className="text-xs text-muted-foreground">
              최신 {latestDate || "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">선택 날짜 랭킹</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyEntries.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedDate || "데이터 없음"}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">채널 캐시</h2>
            <p className="text-sm text-muted-foreground">
              수집 대상 채널 기본 정보를 검색하고 수정합니다.
            </p>
          </div>
          <AdminSearch placeholder="채널명 또는 채널 ID 검색..." />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>HOT 채널 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>채널</TableHead>
                    <TableHead className="text-right">구독자</TableHead>
                    <TableHead className="text-right">영상 수</TableHead>
                    <TableHead className="text-right">평균 조회수</TableHead>
                    <TableHead className="text-right">총 조회수</TableHead>
                    <TableHead>갱신일</TableHead>
                    <TableHead className="w-[120px]">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotList.data.map((ch) => (
                    <TableRow key={ch.channel_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {ch.thumbnail_url ? (
                            <img
                              src={ch.thumbnail_url}
                              alt=""
                              className="h-9 w-9 rounded-full border object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted text-xs text-muted-foreground">
                              CH
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-foreground">
                              {ch.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {ch.channel_id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(ch.subscriber_count)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(ch.video_count)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatNumber(ch.avg_view_count)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(ch.total_view_count)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ch.updated_at
                          ? new Date(ch.updated_at).toLocaleDateString("ko-KR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <EditHotChannelButton
                            channel={ch as unknown as Record<string, unknown>}
                          />
                          <DeleteHotChannelButton channelId={ch.channel_id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!hotList.data.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        채널 데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <AdminPagination
          currentPage={currentPage}
          totalPages={hotList.totalPages}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              일별 HOT 랭킹 관리
            </h2>
            <p className="text-sm text-muted-foreground">
              홈페이지에 노출되는 날짜별 영상 순위를 직접 확인하고 수정합니다.
            </p>
          </div>
          <AddHotListDailyButton defaultDate={selectedDate || latestDate || ""} />
        </div>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-violet-500" />
                  {selectedDate
                    ? `${selectedDate} 랭킹`
                    : "수집된 랭킹 데이터가 없습니다"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  최근 수집일을 클릭하면 해당 일자의 랭킹과 지표를 바로 수정할 수 있습니다.
                </p>
              </div>
              {selectedDate && (
                <Badge variant="secondary" className="w-fit">
                  {dailyEntries.length}개 영상
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {dailyDates.slice(0, 14).map((item) => {
                const query = buildQueryString(
                  { q, page, date: selectedDate || undefined },
                  { date: item.date }
                );

                return (
                  <a
                    key={item.date}
                    href={`?${query}`}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${
                      item.date === selectedDate
                        ? "border-violet-500 bg-violet-500 text-white"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{item.date}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs ${
                        item.date === selectedDate
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.count}
                    </span>
                  </a>
                );
              })}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">순위</TableHead>
                    <TableHead>영상</TableHead>
                    <TableHead className="text-right">조회수</TableHead>
                    <TableHead className="text-right">성과율</TableHead>
                    <TableHead className="text-right">속도</TableHead>
                    <TableHead className="text-right">점수</TableHead>
                    <TableHead className="w-[140px]">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          #{entry.rank || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {entry.video?.thumbnail_url ? (
                            <img
                              src={entry.video.thumbnail_url}
                              alt=""
                              className="h-12 w-16 rounded-md border object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-16 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                              VIDEO
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">
                              {entry.video?.title || entry.video_id}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {entry.channel?.title || "채널 미매핑"}
                            </div>
                            {!!entry.reason_flags?.length && (
                              <div className="flex flex-wrap gap-1">
                                {entry.reason_flags.slice(0, 3).map((flag) => (
                                  <Badge
                                    key={`${entry.id}-${flag}`}
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {flag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(entry.view_count)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <div className="inline-flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                          {entry.performance_rate.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(entry.view_velocity)}/h
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {entry.score.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <EditHotListDailyButton entry={entry} />
                          <DeleteHotListDailyButton id={entry.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!dailyEntries.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        선택한 날짜의 HOT 랭킹 데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
