import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Coins,
  Users,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { AdminChart } from "@/components/admin/AdminChart";
import { getTranslations } from "next-intl/server";

async function getAdminStats() {
  const supabase = createAdminClient();

  // 총 사용자 수
  const { count: totalUsers } = await supabase
    .from("user_plans")
    .select("*", { count: "exact", head: true });

  // 유료 사용자 (pro 또는 allinone)
  const { count: paidUsers } = await supabase
    .from("user_plans")
    .select("*", { count: "exact", head: true })
    .in("plan_type", ["pro", "allinone"]);

  // 오늘 매출 (toss_payments)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayPayments } = await supabase
    .from("toss_payments")
    .select("amount, credits")
    .gte("created_at", todayStart.toISOString());

  const salesToday = todayPayments?.length || 0;
  const revenueToday = todayPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  // 이번 달 총 매출
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthPayments } = await supabase
    .from("toss_payments")
    .select("amount")
    .gte("created_at", monthStart.toISOString());

  const monthlyRevenue = monthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  // 전체 총 매출
  const { data: allPayments } = await supabase
    .from("toss_payments")
    .select("amount");

  const totalRevenue = allPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  // 월별 차트 데이터 (최근 6개월)
  const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const chartData: { name: string; mrr: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const { data: mPayments } = await supabase
      .from("toss_payments")
      .select("amount")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    chartData.push({
      name: months[date.getMonth()],
      mrr: mPayments?.reduce((sum, p) => sum + p.amount, 0) || 0,
    });
  }

  // 최근 결제 내역
  const { data: recentPayments } = await supabase
    .from("toss_payments")
    .select("id, order_name, amount, credits, created_at, user_id, user:users(email)")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    totalUsers: totalUsers || 0,
    paidUsers: paidUsers || 0,
    salesToday,
    revenueToday,
    monthlyRevenue,
    totalRevenue,
    chartData,
    recentPayments: recentPayments || [],
  };
}

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();
  const t = await getTranslations("Admin.overview");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 이번 달 매출 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 매출</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.monthlyRevenue.toLocaleString("ko-KR")}원
            </div>
            <p className="text-xs text-muted-foreground">
              총 누적: {stats.totalRevenue.toLocaleString("ko-KR")}원
            </p>
          </CardContent>
        </Card>

        {/* 전체 사용자 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              유료: {stats.paidUsers}명
            </p>
          </CardContent>
        </Card>

        {/* 오늘 판매 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 판매</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">+{stats.salesToday}건</div>
            <p className="text-xs text-muted-foreground">
              {stats.revenueToday.toLocaleString("ko-KR")}원
            </p>
          </CardContent>
        </Card>

        {/* 유료 전환율 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">유료 전환율</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalUsers > 0
                ? ((stats.paidUsers / stats.totalUsers) * 100).toFixed(1)
                : "0"}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.paidUsers} / {stats.totalUsers}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <AdminChart data={stats.chartData} />
        </div>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>최근 결제</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentPayments.map(
                (payment: Record<string, unknown>) => {
                  const userArr = payment.user as
                    | { email: string }[]
                    | null;
                  const userInfo = Array.isArray(userArr) ? userArr[0] : null;
                  return (
                    <div key={payment.id as string} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">
                          {userInfo?.email || (payment.user_id as string).substring(0, 15)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.order_name as string}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(payment.created_at as string).toLocaleString("ko-KR")}
                        </p>
                      </div>
                      <div className="ml-auto font-medium text-foreground">
                        {(payment.amount as number).toLocaleString("ko-KR")}원
                      </div>
                    </div>
                  );
                }
              )}
              {!stats.recentPayments.length && (
                <p className="text-sm text-muted-foreground">
                  결제 내역이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
