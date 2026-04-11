import { Activity, Coins, FileText, UserPlus } from "lucide-react";
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

async function getActivityStats() {
  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [
    { count: newUsersToday },
    { count: totalUsers },
    { count: scriptsToday },
    { data: scriptUsers },
    { data: paymentUsers },
    { data: completedLectureUsers },
    { data: batchUsers },
    { data: creditUsageRows, error: creditUsageError },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("script_generations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),
    supabase
      .from("script_generations")
      .select("user_id")
      .gte("created_at", todayISO),
    supabase
      .from("toss_payments")
      .select("user_id")
      .gte("created_at", todayISO),
    supabase
      .from("lecture_progress")
      .select("user_id")
      .gte("completed_at", todayISO),
    supabase
      .from("batch_job_items")
      .select("user_id")
      .gte("created_at", todayISO),
    supabase
      .from("credit_transactions")
      .select("amount")
      .lt("amount", 0)
      .gte("created_at", todayISO),
  ]);

  const activeUserIds = new Set<string>();

  for (const row of scriptUsers || []) activeUserIds.add(row.user_id);
  for (const row of paymentUsers || []) activeUserIds.add(row.user_id);
  for (const row of completedLectureUsers || []) activeUserIds.add(row.user_id);
  for (const row of batchUsers || []) activeUserIds.add(row.user_id);

  const creditsUsedToday = creditUsageError
    ? null
    : (creditUsageRows || []).reduce((sum, row) => sum + Math.abs(row.amount || 0), 0);

  return {
    dau: activeUserIds.size,
    scriptsToday: scriptsToday || 0,
    creditsUsedToday,
    creditsSource: creditUsageError ? "credit ledger 미설정" : "credit_transactions 기준",
    newUsersToday: newUsersToday || 0,
    totalUsers: totalUsers || 0,
  };
}

async function getUserList(filters?: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = createAdminClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("users")
    .select("id, email, full_name, avatar_url, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (filters?.q) {
    query = query.ilike("email", `%${filters.q}%`);
  }

  const { data: users, count } = await query.range(from, to);
  const userIds = (users || []).map((user) => user.id);

  const { data: plans } = userIds.length
    ? await supabase
        .from("user_plans")
        .select("user_id, credits, plan_type")
        .in("user_id", userIds)
    : { data: [] };

  const planMap = new Map((plans || []).map((plan) => [plan.user_id, plan]));

  return {
    data: (users || []).map((user) => ({
      ...user,
      plan: planMap.get(user.id) || null,
    })),
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  };
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const t = await getTranslations("Admin.activity");

  const [stats, users] = await Promise.all([
    getActivityStats(),
    getUserList({ q, page: currentPage }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dau")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dau}</div>
            <p className="text-xs text-muted-foreground">
              오늘 스크립트/결제/강의완료/배치 활동 사용자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("scriptsToday")}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scriptsToday}</div>
            <p className="text-xs text-muted-foreground">
              script_generations 기준
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("creditsUsedToday")}
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.creditsUsedToday === null ? "-" : stats.creditsUsedToday}
            </div>
            <p className="text-xs text-muted-foreground">{stats.creditsSource}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("newUsers")}
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersToday}</div>
            <p className="text-xs text-muted-foreground">
              {t("newUsersDesc")} (Total: {stats.totalUsers})
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("userList")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminSearch placeholder="Search email..." />

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("planType")}</TableHead>
                  <TableHead className="text-right">{t("credits")}</TableHead>
                  <TableHead>{t("joinedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.full_name || ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.plan ? "default" : "secondary"}>
                        {user.plan?.plan_type || "none"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.plan?.credits ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                  </TableRow>
                ))}
                {!users.data.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {t("noUsers")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <AdminPagination
            currentPage={currentPage}
            totalPages={users.totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
