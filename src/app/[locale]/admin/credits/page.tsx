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
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminFilter } from "@/components/admin/AdminFilter";
import { Coins, TrendingUp, TrendingDown, Users } from "lucide-react";
import { CreditAdjustDialog } from "@/components/admin/CreditAdjustDialog";

async function getCreditStats() {
  const supabase = createAdminClient();

  // Get all user plans for aggregate stats
  const { data: allPlans } = await supabase
    .from("user_plans")
    .select("credits, plan_type, user_id");

  const totalUsers = allPlans?.length || 0;
  const totalRemaining = allPlans?.reduce((sum, p) => sum + (p.credits || 0), 0) || 0;
  const avgPerUser = totalUsers > 0 ? Math.round(totalRemaining / totalUsers) : 0;

  return { totalUsers, totalRemaining, avgPerUser };
}

async function getCreditUsers(filters?: {
  q?: string;
  planType?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = createAdminClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 1. user_plans 조회
  let query = supabase
    .from("user_plans")
    .select("user_id, credits, plan_type, expires_at", { count: "exact" })
    .order("credits", { ascending: false });

  if (filters?.planType && filters.planType !== "all") {
    query = query.eq("plan_type", filters.planType);
  }

  const { data: plans, count } = await query.range(from, to);

  // 2. users 별도 조회
  const userIds = (plans || []).map((p: Record<string, unknown>) => p.user_id as string);
  const { data: users } = userIds.length > 0
    ? await supabase.from("users").select("id, email, full_name").in("id", userIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: Record<string, unknown>) => [u.id as string, u]));

  const mappedData = (plans || []).map((item: Record<string, unknown>) => {
    const userId = item.user_id as string;
    const userInfo = userMap.get(userId) as { id: string; email: string; full_name: string | null } | undefined;
    return {
      user_id: userId,
      credits: item.credits as number,
      plan_type: item.plan_type as string,
      expires_at: item.expires_at as string | null,
      user: userInfo || null,
    };
  });

  let filteredData = mappedData;

  if (filters?.q) {
    const q = filters.q.toLowerCase();
    filteredData = filteredData.filter(
      (item) => item.user?.email?.toLowerCase().includes(q)
    );
  }

  return {
    data: filteredData,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export default async function AdminCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; planType?: string; page?: string }>;
}) {
  const { q, planType, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const t = await getTranslations("Admin.credits");

  const [stats, users] = await Promise.all([
    getCreditStats(),
    getCreditUsers({ q, planType, page: currentPage }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <CreditAdjustDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalRemaining")}
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRemaining.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("avgPerUser")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPerUser}</div>
            <p className="text-xs text-muted-foreground">credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalIssued")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">-</div>
            <p className="text-xs text-muted-foreground">
              Requires credit_transactions table
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Credits Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("transactionHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <AdminSearch placeholder="Search user email..." />
            <AdminFilter
              name="planType"
              placeholder="All Plans"
              options={[
                { label: "Free", value: "free" },
                { label: "Pro", value: "pro" },
                { label: "All-in-One", value: "allinone" },
              ]}
            />
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("user")}</TableHead>
                  <TableHead>{t("planType")}</TableHead>
                  <TableHead className="text-right">
                    {t("creditBalance")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.map((item) => (
                  <TableRow key={item.user_id}>
                    <TableCell>
                      <div className="font-medium">
                        {item.user?.email || item.user_id.slice(0, 12)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.user?.full_name || ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.plan_type === "allinone"
                            ? "default"
                            : item.plan_type === "pro"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {item.plan_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.credits}
                    </TableCell>
                  </TableRow>
                ))}
                {!users.data.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      {t("noTransactions")}
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
