import { Activity, Coins, FileText, UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getInternalAdminUsers } from "@/lib/admin/internal-users";
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

const SALES_ACTIVITY_STATUSES = ["DONE", "PARTIAL_CANCELLED"] as const;
const SEOUL_TIME_ZONE = "Asia/Seoul";

function getKstDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return { year, month, day };
}

function getKstDayRange(dayOffset = 0) {
  const { year, month, day } = getKstDateParts();
  const start = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
  start.setUTCDate(start.getUTCDate() + dayOffset);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function isValidDateInput(value?: string) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getKstDayRangeForDate(dateInput?: string) {
  if (!isValidDateInput(dateInput)) {
    return getKstDayRange();
  }

  const start = new Date(`${dateInput}T00:00:00+09:00`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function getDateInputValueFromIso(dateIso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateIso));
}

function isBatchUsageLedgerRow(row: {
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return (
    row.description?.includes("generate_batch") ||
    row.metadata?.action === "generate_batch"
  );
}

async function getActivityStats(dateInput?: string) {
  const supabase = createAdminClient();
  const internalAdmins = await getInternalAdminUsers();
  const internalAdminIds = new Set(internalAdmins.map((user) => user.id));
  const { startIso: selectedStartIso, endIso: selectedEndIso } =
    getKstDayRangeForDate(dateInput);

  const [
    { data: newUsersTodayRows },
    { count: totalUsersRaw },
    { data: scriptRows },
    { data: paymentRows },
    { data: completedLectureRows },
    { data: batchRows },
    { data: creditUsageRows, error: creditUsageError },
    { data: batchCreditRows, error: batchCreditError },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id")
      .gte("created_at", selectedStartIso)
      .lt("created_at", selectedEndIso),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("script_generations")
      .select("id, user_id")
      .gte("created_at", selectedStartIso)
      .lt("created_at", selectedEndIso),
    supabase
      .from("toss_payments")
      .select("user_id")
      .in("status", [...SALES_ACTIVITY_STATUSES])
      .gte("created_at", selectedStartIso)
      .lt("created_at", selectedEndIso),
    supabase
      .from("lecture_progress")
      .select("user_id")
      .gte("completed_at", selectedStartIso)
      .lt("completed_at", selectedEndIso),
    supabase
      .from("batch_job_items")
      .select("user_id")
      .gte("created_at", selectedStartIso)
      .lt("created_at", selectedEndIso),
    supabase
      .from("credit_transactions")
      .select("user_id, amount, description, metadata")
      .lt("amount", 0)
      .gte("created_at", selectedStartIso)
      .lt("created_at", selectedEndIso),
    supabase
      .from("batch_job_items")
      .select("user_id, credits_deducted, credits_refunded")
      .gt("credits_deducted", 0)
      .gte("created_at", selectedStartIso)
      .lt("created_at", selectedEndIso),
  ]);

  const activeUserIds = new Set<string>();

  for (const row of paymentRows || []) {
    if (!internalAdminIds.has(row.user_id)) activeUserIds.add(row.user_id);
  }
  for (const row of completedLectureRows || []) {
    if (!internalAdminIds.has(row.user_id)) activeUserIds.add(row.user_id);
  }
  for (const row of batchRows || []) {
    if (!internalAdminIds.has(row.user_id)) activeUserIds.add(row.user_id);
  }
  for (const row of scriptRows || []) {
    if (!internalAdminIds.has(row.user_id)) activeUserIds.add(row.user_id);
  }

  const scriptsToday = (scriptRows || []).filter((row) => !internalAdminIds.has(row.user_id)).length;
  const newUsersToday = (newUsersTodayRows || []).filter((row) => !internalAdminIds.has(row.id)).length;
  const nonBatchLedgerCreditsUsed = creditUsageError
    ? null
    : (creditUsageRows || [])
        .filter((row) => !isBatchUsageLedgerRow(row))
        .reduce((sum, row) => sum + Math.abs(row.amount || 0), 0);
  const batchCreditsUsed = batchCreditError
    ? null
    : (batchCreditRows || [])
        .reduce(
          (sum, row) =>
            sum + Math.max(0, (row.credits_deducted || 0) - (row.credits_refunded || 0)),
          0,
        );
  const creditsUsedToday =
    nonBatchLedgerCreditsUsed === null && batchCreditsUsed === null
      ? null
      : (nonBatchLedgerCreditsUsed || 0) + (batchCreditsUsed || 0);

  return {
    selectedDate: getDateInputValueFromIso(selectedStartIso),
    dau: activeUserIds.size,
    scriptsToday,
    creditsUsedToday,
    creditsSource:
      creditUsageError && batchCreditError
        ? "크레딧 집계 테이블 미설정"
        : "일반 차감 + 배치 차감 기준",
    newUsersToday,
    totalUsers: Math.max(0, (totalUsersRaw || 0) - internalAdmins.length),
  };
}

async function getUserList(filters?: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = createAdminClient();
  const internalAdmins = await getInternalAdminUsers();
  const internalAdminIds = new Set(internalAdmins.map((user) => user.id));
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("users")
    .select("id, email, full_name, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (filters?.q) {
    query = query.ilike("email", `%${filters.q}%`);
  }

  const { data: users } = await query;
  const filteredUsers = (users || []).filter((user) => !internalAdminIds.has(user.id));
  const pagedUsers = filteredUsers.slice(from, to + 1);
  const userIds = pagedUsers.map((user) => user.id);

  const { data: plans } = userIds.length
    ? await supabase
        .from("user_plans")
        .select("user_id, credits, plan_type")
        .in("user_id", userIds)
    : { data: [] };

  const planMap = new Map((plans || []).map((plan) => [plan.user_id, plan]));

  return {
    data: pagedUsers.map((user) => ({
      ...user,
      plan: planMap.get(user.id) || null,
    })),
    totalPages: Math.max(1, Math.ceil(filteredUsers.length / pageSize)),
  };
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; date?: string }>;
}) {
  const { q, page, date } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const t = await getTranslations("Admin.activity");

  const [stats, users] = await Promise.all([
    getActivityStats(date),
    getUserList({ q, page: currentPage }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-xs text-muted-foreground">
          조회일
          <input
            type="date"
            name="date"
            defaultValue={stats.selectedDate}
            className="h-9 rounded-md border bg-background px-3 text-sm text-foreground"
          />
        </label>
        <button
          type="submit"
          className="h-9 rounded-md bg-foreground px-3 text-sm font-medium text-background"
        >
          적용
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dau")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dau}</div>
            <p className="text-xs text-muted-foreground">
              내부 계정을 제외한 오늘 스크립트, 실결제, 강의 완료, 배치 실행 사용자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("scriptsToday")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scriptsToday}</div>
            <p className="text-xs text-muted-foreground">내부 계정 제외 script_generations 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("creditsUsedToday")}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t("newUsers")}</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersToday}</div>
            <p className="text-xs text-muted-foreground">
              내부 계정 제외 {t("newUsersDesc")} (Total: {stats.totalUsers})
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
                      {new Date(user.created_at).toLocaleDateString("ko-KR", {
                        timeZone: SEOUL_TIME_ZONE,
                      })}
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
          <AdminPagination currentPage={currentPage} totalPages={users.totalPages} />
        </CardContent>
      </Card>
    </div>
  );
}
