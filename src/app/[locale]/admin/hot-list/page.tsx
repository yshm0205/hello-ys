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
import { Flame, Clock, Database } from "lucide-react";
import { HotListTriggerButton } from "@/components/admin/HotListTriggerButton";
import {
  AddHotTrendButton,
  EditHotTrendButton,
  DeleteHotTrendButton,
} from "@/components/admin/HotTrendForm";

interface HotTrend {
  id: string;
  keyword: string;
  category: string | null;
  score: number;
  source: string | null;
  created_at: string;
}

async function getHotListData() {
  const supabase = createAdminClient();

  try {
    const { data, count, error } = await supabase
      .from("hot_trends")
      .select("*", { count: "exact" })
      .order("score", { ascending: false })
      .limit(50);

    if (error) {
      return { data: [], totalItems: 0, tableExists: false, lastCollected: null };
    }

    const lastCollected = data?.[0]?.created_at || null;

    return {
      data: (data as HotTrend[]) || [],
      totalItems: count || 0,
      tableExists: true,
      lastCollected,
    };
  } catch {
    return { data: [], totalItems: 0, tableExists: false, lastCollected: null };
  }
}

export default async function AdminHotListPage() {
  const t = await getTranslations("Admin.hotList");
  const hotList = await getHotListData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex gap-2">
          {hotList.tableExists && <AddHotTrendButton />}
          <HotListTriggerButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("lastCollected")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {hotList.lastCollected
                ? new Date(hotList.lastCollected).toLocaleString("ko-KR")
                : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalItems")}
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hotList.totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("collectionStatus")}
            </CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-500">
              {hotList.tableExists ? "Active" : "Not configured"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      {!hotList.tableExists ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <Flame className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">
                  hot_trends 테이블이 없습니다
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Supabase에서 아래 SQL을 실행해주세요.
                </p>
                <pre className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-md text-xs text-left overflow-x-auto max-w-lg mx-auto">
{`CREATE TABLE hot_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  category TEXT,
  score NUMERIC DEFAULT 0,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("collectedData")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("keyword")}</TableHead>
                    <TableHead>{t("category")}</TableHead>
                    <TableHead className="text-right">{t("score")}</TableHead>
                    <TableHead>소스</TableHead>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead className="w-[100px]">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotList.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.keyword}
                      </TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell className="text-right">
                        {item.score}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.source || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(item.created_at).toLocaleDateString("ko-KR")}
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
                      <TableCell colSpan={6} className="h-24 text-center">
                        {t("noData")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
