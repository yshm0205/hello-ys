import { Coins, TrendingUp, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CreditAdjustDialog } from "@/components/admin/CreditAdjustDialog";
import { AdminFilter } from "@/components/admin/AdminFilter";
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
import { getPaginatedUserPlans } from "@/lib/admin/user-plans";
import { createAdminClient } from "@/utils/supabase/admin";

const planLabels: Record<string, string> = {
  free: "무료",
  pro: "Pro",
  allinone: "올인원",
};

async function getCreditStats() {
  const supabase = createAdminClient();

  const [{ data: allPlans }, { data: ledgerRows, error: ledgerError }, { data: purchases }] =
    await Promise.all([
      supabase.from("user_plans").select("credits, user_id"),
      supabase.from("credit_transactions").select("amount"),
      supabase.from("toss_payments").select("credits, status").eq("status", "DONE"),
    ]);

  const totalUsers = allPlans?.length || 0;
  const totalRemaining = allPlans?.reduce((sum, plan) => sum + (plan.credits || 0), 0) || 0;
  const avgPerUser = totalUsers > 0 ? Math.round(totalRemaining / totalUsers) : 0;

  const ledgerIssued = ledgerError
    ? 0
    : (ledgerRows || []).reduce(
        (sum, row) => sum + (row.amount > 0 ? row.amount : 0),
        0,
      );
  const purchasedIssued = (purchases || []).reduce(
    (sum, row) => sum + (row.credits || 0),
    0,
  );

  return {
    totalUsers,
    totalRemaining,
    avgPerUser,
    totalIssued: ledgerIssued > 0 ? ledgerIssued : purchasedIssued,
    totalIssuedSource: ledgerIssued > 0 ? "credit_transactions 기준" : "toss_payments 기준",
  };
}

export default async function AdminCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; planType?: string; page?: string }>;
}) {
  const { q, planType, page } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const t = await getTranslations("Admin.credits");

  const [stats, users] = await Promise.all([
    getCreditStats(),
    getPaginatedUserPlans({ q, planType, page: currentPage, pageSize: 15 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <CreditAdjustDialog />
      </div>

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
            <div className="text-2xl font-bold">{stats.totalIssued.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalIssuedSource}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("transactionHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
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

          <div className="rounded-md border">
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
                        variant={item.plan_type === "free" ? "secondary" : "default"}
                      >
                        {planLabels[item.plan_type] || item.plan_type}
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
