import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, TrendingDown } from "lucide-react";
import { AdminChart } from "@/components/admin/AdminChart";
import { getTranslations } from "next-intl/server";
import { getPlanByVariantId } from "@/lib/lemon/plans";

async function getAdminStats() {
  // Admin Client 사용 (RLS 우회)
  const supabase = createAdminClient();

  // 활성 구독자 수와 plan_id 조회
  const { data: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("status", "active");

  const activeCount = activeSubscriptions?.length || 0;

  // MRR 계산 (plan_id 기반 가격 합산)
  let mrr = 0;
  activeSubscriptions?.forEach((sub) => {
    const plan = getPlanByVariantId(sub.plan_id);
    // "$29/month" → 29 추출
    const priceMatch = plan.price.match(/\$(\d+)/);
    mrr += priceMatch ? parseInt(priceMatch[1]) : 0;
  });

  // 오늘 판매량 (최근 24시간 내 생성된 구독)
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();
  const { count: salesToday } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", twentyFourHoursAgo);

  // 최근 구독 내역 (최신 5건)
  const { data: recentSubs } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      status,
      updated_at,
      plan_name,
      user_id
    `
    )
    .order("updated_at", { ascending: false })
    .limit(5);

  // 월별 성장 데이터
  // 실제 서비스에서는 월별 MRR 스냅샷을 별도 테이블에 저장하는 것이 좋음
  // 현재는 이번 달 MRR만 표시
  const currentMonth = new Date().toLocaleString("en", { month: "short" });
  const chartData = mrr > 0 ? [{ name: currentMonth, mrr }] : [];

  return {
    activeCount: activeCount || 0,
    mrr,
    recentSubs: recentSubs || [],
    salesToday: salesToday || 0,
    chartData,
  };
}

interface Subscription {
  id: string;
  status: string;
  updated_at: string;
  plan_name: string;
  user_id: string;
}

export default async function AdminOverviewPage() {
  const { activeCount, mrr, recentSubs, salesToday, chartData } =
    await getAdminStats();
  const t = await getTranslations("Admin.overview");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("mrr")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mrr.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t("mrrChange")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("activeSubscribers")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("subscribersChange")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("salesToday")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{salesToday}</div>
            <p className="text-xs text-muted-foreground">{t("salesChange")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("churnRate")}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-500">-%</div>
            <p className="text-xs text-muted-foreground">{t("churnChange")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <AdminChart data={chartData} />
        </div>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t("recentSubscriptions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSubs?.map((sub: Subscription) => (
                <div key={sub.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {sub.user_id.substring(0, 15)}...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sub.plan_name} ({sub.status})
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(sub.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {sub.status === "active" ? "+$19.00" : "$0.00"}
                  </div>
                </div>
              ))}
              {!recentSubs?.length && (
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
