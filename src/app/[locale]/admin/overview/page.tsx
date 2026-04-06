import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Users,
  CreditCard,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AdminChart } from "@/components/admin/AdminChart";
import { getTranslations } from "next-intl/server";
import { getPlanByVariantId } from "@/lib/lemon/plans";

async function getAdminStats() {
  const supabase = createAdminClient();

  // Active subscriptions with plan_id
  const { data: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("status", "active");

  const activeCount = activeSubscriptions?.length || 0;

  // MRR calculation
  let mrr = 0;
  activeSubscriptions?.forEach((sub) => {
    const plan = getPlanByVariantId(sub.plan_id);
    mrr += plan.priceNumber || 0;
  });

  // Sales today (last 24h)
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();
  const { count: salesToday } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", twentyFourHoursAgo);

  // Churn rate (last 30 days)
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Count subscriptions that existed 30 days ago (created before 30 days ago)
  const { count: totalAtStart } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .lte("created_at", thirtyDaysAgo);

  // Count cancellations in last 30 days
  const { count: cancelledInPeriod } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "canceled")
    .gte("updated_at", thirtyDaysAgo);

  const churnRate =
    totalAtStart && totalAtStart > 0
      ? ((cancelledInPeriod || 0) / totalAtStart) * 100
      : 0;

  // Previous month MRR for comparison
  const sixtyDaysAgo = new Date(
    Date.now() - 60 * 24 * 60 * 60 * 1000
  ).toISOString();
  const { count: prevActiveCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .lte("created_at", thirtyDaysAgo);

  const prevMrr = (prevActiveCount || 0) * 19; // approximate
  const mrrGrowth =
    prevMrr > 0 ? (((mrr - prevMrr) / prevMrr) * 100).toFixed(1) : "0";
  const subscriberGrowth =
    prevActiveCount && prevActiveCount > 0
      ? (
          ((activeCount - prevActiveCount) / prevActiveCount) *
          100
        ).toFixed(1)
      : "0";

  // Monthly chart data (last 6 months)
  const chartData: { name: string; mrr: number }[] = [];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .lte("created_at", monthEnd.toISOString());

    chartData.push({
      name: months[date.getMonth()],
      mrr: (count || 0) * 19, // approximate per-subscriber
    });
  }

  // Recent subscriptions with user info
  const { data: recentSubs } = await supabase
    .from("subscriptions")
    .select(
      "id, status, updated_at, plan_name, plan_id, user_id, user:users(email, full_name)"
    )
    .order("updated_at", { ascending: false })
    .limit(5);

  return {
    activeCount,
    mrr,
    recentSubs: recentSubs || [],
    salesToday: salesToday || 0,
    churnRate,
    mrrGrowth,
    subscriberGrowth,
    chartData,
  };
}

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();
  const t = await getTranslations("Admin.overview");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* MRR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("mrr")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${stats.mrr.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {Number(stats.mrrGrowth) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              {Number(stats.mrrGrowth) >= 0 ? "+" : ""}
              {stats.mrrGrowth}% {t("mrrChange")}
            </p>
          </CardContent>
        </Card>

        {/* Active Subscribers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("activeSubscribers")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {Number(stats.subscriberGrowth) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              {Number(stats.subscriberGrowth) >= 0 ? "+" : ""}
              {stats.subscriberGrowth}% {t("subscribersChange")}
            </p>
          </CardContent>
        </Card>

        {/* Sales Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("salesToday")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">+{stats.salesToday}</div>
            <p className="text-xs text-muted-foreground">{t("salesChange")}</p>
          </CardContent>
        </Card>

        {/* Churn Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("churnRate")}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                stats.churnRate > 5
                  ? "text-red-500"
                  : stats.churnRate > 0
                    ? "text-yellow-500"
                    : "text-green-500"
              }`}
            >
              {stats.churnRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">{t("churnChange")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <AdminChart data={stats.chartData} />
        </div>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t("recentSubscriptions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentSubs?.map(
                (sub: Record<string, unknown>) => {
                  const plan = getPlanByVariantId(sub.plan_id as string);
                  const userArr = sub.user as
                    | { email: string; full_name: string | null }[]
                    | null;
                  const userInfo = Array.isArray(userArr)
                    ? userArr[0]
                    : null;
                  return (
                    <div key={sub.id as string} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">
                          {userInfo?.email ||
                            (sub.user_id as string).substring(0, 15)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(sub.plan_name as string) || plan.name} ({sub.status as string})
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(sub.updated_at as string).toLocaleString()}
                        </p>
                      </div>
                      <div className="ml-auto font-medium text-foreground">
                        {sub.status === "active"
                          ? `$${plan.priceNumber || 19}`
                          : "$0"}
                      </div>
                    </div>
                  );
                }
              )}
              {!stats.recentSubs?.length && (
                <p className="text-sm text-muted-foreground">
                  {t("noSubscriptions")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
