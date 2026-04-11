import { CalendarDays, Database, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/utils/supabase/admin";
import { HotListTriggerButton } from "@/components/admin/HotListTriggerButton";
import {
  BulkUploadButton,
  DeleteChannelListButton,
  DeleteMonthButton,
  EditChannelListButton,
} from "@/components/admin/ChannelListForm";

interface ChannelListItem {
  id: string;
  channel_id: string | null;
  month: string;
  title: string;
  subscriber_count: number;
  avg_view_count: number;
  median_views: number;
  category: string;
  subcategory: string;
  format: string;
  channel_url: string;
}

async function getAvailableMonths() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("channel_list")
    .select("month")
    .order("month", { ascending: false });

  return [...new Set((data || []).map((row) => row.month))];
}

async function getChannelList(filters?: {
  q?: string;
  page?: number;
  pageSize?: number;
  month?: string;
}) {
  const supabase = createAdminClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("channel_list")
    .select("*", { count: "exact" })
    .order("avg_view_count", { ascending: false });

  if (filters?.month) {
    query = query.eq("month", filters.month);
  }

  if (filters?.q) {
    query = query.or(`title.ilike.%${filters.q}%,channel_id.ilike.%${filters.q}%`);
  }

  const { data, count } = await query.range(from, to);

  return {
    data: (data as ChannelListItem[]) || [],
    totalItems: count || 0,
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  };
}

function formatNumber(value: number | null | undefined) {
  return (value || 0).toLocaleString("ko-KR");
}

function buildQueryString(
  current: { q?: string; page?: string; month?: string },
  next: Partial<{ q?: string; page?: string; month?: string }>,
) {
  const params = new URLSearchParams();
  const merged = { ...current, ...next };

  if (merged.q) params.set("q", merged.q);
  if (merged.page) params.set("page", merged.page);
  if (merged.month) params.set("month", merged.month);

  return params.toString();
}

export default async function AdminHotListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; month?: string }>;
}) {
  const { q, page, month } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const t = await getTranslations("Admin.hotList");

  const availableMonths = await getAvailableMonths();
  const selectedMonth =
    month && availableMonths.includes(month) ? month : availableMonths[0] || "";

  const hotList = await getChannelList({
    q,
    page: currentPage,
    month: selectedMonth,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            수강생에게 노출되는 월별 채널 리스트를 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BulkUploadButton />
          <HotListTriggerButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">월 데이터</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableMonths.length}</div>
            <p className="text-xs text-muted-foreground">
              최신 {availableMonths[0] || "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">채널 리스트</h2>
            <p className="text-sm text-muted-foreground">
              월별 벤치마크 채널 목록과 노출 지표를 관리합니다.
            </p>
          </div>
          <AdminSearch placeholder="채널명 또는 채널 ID 검색..." />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableMonths.map((entryMonth) => {
            const query = buildQueryString(
              { q, page, month: selectedMonth },
              { month: entryMonth, page: "1" },
            );

            return (
              <a
                key={entryMonth}
                href={`?${query}`}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
                  entryMonth === selectedMonth
                    ? "border-violet-500 bg-violet-500 text-white"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {entryMonth}
              </a>
            );
          })}
          {selectedMonth && <DeleteMonthButton month={selectedMonth} />}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{selectedMonth} 채널 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>채널</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead className="text-right">구독자</TableHead>
                    <TableHead className="text-right">평균 조회수</TableHead>
                    <TableHead className="text-right">중위 조회수</TableHead>
                    <TableHead className="w-[120px]">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotList.data.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{channel.title}</div>
                        {channel.channel_id && (
                          <div className="text-xs text-muted-foreground">
                            {channel.channel_id}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {channel.category ? (
                          <Badge variant="secondary">{channel.category}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(channel.subscriber_count)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatNumber(channel.avg_view_count)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(channel.median_views)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <EditChannelListButton
                            channel={channel as unknown as Record<string, unknown>}
                          />
                          <DeleteChannelListButton id={channel.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!hotList.data.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        채널 데이터가 없습니다. 엑셀 업로드로 등록해 주세요.
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
    </div>
  );
}
