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
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { Flame, Database, Eye } from "lucide-react";
import { HotListTriggerButton } from "@/components/admin/HotListTriggerButton";
import {
  AddHotTrendButton,
  EditHotTrendButton,
  DeleteHotTrendButton,
} from "@/components/admin/HotTrendForm";

interface HotTrend {
  id: string;
  category: string;
  title: string;
  channel_name: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  view_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

async function getHotListData() {
  const supabase = createAdminClient();

  const { data, count, error } = await supabase
    .from("hot_trends")
    .select("*", { count: "exact" })
    .order("sort_order", { ascending: true })
    .limit(50);

  if (error) {
    console.error("hot_trends query error:", error.message);
  }

  return {
    data: (data as HotTrend[]) || [],
    totalItems: count || 0,
  };
}

export default async function AdminHotListPage() {
  const t = await getTranslations("Admin.hotList");
  const hotList = await getHotListData();

  const activeCount = hotList.data.filter((d) => d.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex gap-2">
          <AddHotTrendButton />
          <HotListTriggerButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 항목</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hotList.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 항목</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 조회수</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hotList.data.reduce((sum, d) => sum + d.view_count, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("collectedData")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">순서</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>채널</TableHead>
                  <TableHead className="text-right">조회수</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="w-[100px]">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotList.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-center text-muted-foreground">
                      {item.sort_order}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.title}
                    </TableCell>
                    <TableCell>{item.category || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.channel_name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.view_count.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditHotTrendButton trend={item} />
                        <DeleteHotTrendButton trendId={item.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!hotList.data.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
