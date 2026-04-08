import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTranslations } from "next-intl/server";
import { Flame, Database, Users } from "lucide-react";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { HotListTriggerButton } from "@/components/admin/HotListTriggerButton";
import {
  AddHotChannelButton,
  EditHotChannelButton,
  DeleteHotChannelButton,
} from "@/components/admin/HotTrendForm";

async function getHotChannels(filters?: { q?: string; page?: number; pageSize?: number }) {
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
    query = query.or(`title.ilike.%${filters.q}%,channel_id.ilike.%${filters.q}%`);
  }

  const { data, count } = await query.range(from, to);

  return {
    data: data || [],
    totalItems: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export default async function AdminHotListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const t = await getTranslations("Admin.hotList");

  const hotList = await getHotChannels({ q, page: currentPage });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">핫 채널 데이터 관리</p>
        </div>
        <div className="flex gap-2">
          <AddHotChannelButton />
          <HotListTriggerButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 채널</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hotList.totalItems.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 페이지</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPage} / {hotList.totalPages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">표시 중</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hotList.data.length}개</div>
          </CardContent>
        </Card>
      </div>

      <AdminSearch placeholder="채널명 또는 채널 ID 검색..." />

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>핫 채널 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>채널</TableHead>
                  <TableHead className="text-right">구독자</TableHead>
                  <TableHead className="text-right">영상 수</TableHead>
                  <TableHead className="text-right">평균 조회수</TableHead>
                  <TableHead className="text-right">총 조회수</TableHead>
                  <TableHead>갱신일</TableHead>
                  <TableHead className="w-[80px]">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotList.data.map((ch: Record<string, unknown>) => (
                  <TableRow key={ch.channel_id as string}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ch.thumbnail_url && (
                          <img
                            src={ch.thumbnail_url as string}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm">{ch.title as string}</div>
                          <div className="text-xs text-muted-foreground">{ch.channel_id as string}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {((ch.subscriber_count as number) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {((ch.video_count as number) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {((ch.avg_view_count as number) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {((ch.total_view_count as number) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ch.updated_at
                        ? new Date(ch.updated_at as string).toLocaleDateString("ko-KR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditHotChannelButton channel={ch as Record<string, unknown>} />
                        <DeleteHotChannelButton channelId={ch.channel_id as string} />
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
      <AdminPagination currentPage={currentPage} totalPages={hotList.totalPages} />
    </div>
  );
}
