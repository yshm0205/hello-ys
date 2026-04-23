import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminChart } from "@/components/admin/AdminChart";
import { createAdminClient } from "@/utils/supabase/admin";
import { isActiveAccessPlan, PAID_PLAN_TYPES } from "@/lib/plans/config";
import {
  Clock3,
  Coins,
  CreditCard,
  Eye,
  MousePointerClick,
  TrendingUp,
  Users,
} from "lucide-react";

const SALES_STATUSES = ["DONE", "PARTIAL_CANCELLED"] as const;
const SEOUL_TIME_ZONE = "Asia/Seoul";

type SalesStatus = (typeof SALES_STATUSES)[number];

interface UserRelation {
  email: string;
}

interface PaymentRow {
  id: string;
  order_name: string;
  amount: number;
  credits: number;
  created_at: string;
  user_id: string;
  status: SalesStatus;
  metadata: Record<string, unknown> | null;
  user: UserRelation | UserRelation[] | null;
}

interface MarketingSessionRow {
  duration_seconds: number | null;
  pricing_views: number | null;
  cta_clicks: number | null;
  referrer: string | null;
  first_path: string | null;
  first_seen_at: string;
}

interface UserPlanRow {
  plan_type: string | null;
  expires_at: string | null;
}

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

function getKstMonthRange(monthOffset = 0) {
  const { year, month } = getKstDateParts();
  const start = new Date(`${year}-${month}-01T00:00:00+09:00`);
  start.setUTCMonth(start.getUTCMonth() + monthOffset);

  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  return {
    start,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function getNumericMetadata(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = metadata?.[key];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getNetRevenue(payment: Pick<PaymentRow, "amount" | "status" | "metadata">) {
  if (payment.status === "DONE") {
    return payment.amount;
  }

  const cancelledAmount = getNumericMetadata(payment.metadata, "cancelledAmount");
  return Math.max(0, payment.amount - cancelledAmount);
}

function getPaymentEmail(user: PaymentRow["user"], userId: string) {
  if (Array.isArray(user)) {
    return user[0]?.email ?? userId.slice(0, 12);
  }

  return user?.email ?? userId.slice(0, 12);
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    month: "short",
  })
    .format(date)
    .replace(/\s/g, "");
}

async function getAdminStats() {
  const supabase = createAdminClient();
  const { startIso: todayStartIso, endIso: tomorrowStartIso } = getKstDayRange();
  const { startIso: monthStartIso } = getKstMonthRange();

  const monthRanges = Array.from({ length: 6 }, (_, index) => getKstMonthRange(index - 5));

  const [
    { count: totalUsers },
    { data: paidPlanRows },
    { data: todayPayments },
    { data: monthPayments },
    { data: allPayments },
    { data: recentPayments },
    monthlyPaymentSets,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("user_plans")
      .select("plan_type, expires_at")
      .in("plan_type", [...PAID_PLAN_TYPES]),
    supabase
      .from("toss_payments")
      .select("amount, credits, status, metadata")
      .in("status", [...SALES_STATUSES])
      .gte("created_at", todayStartIso)
      .lt("created_at", tomorrowStartIso),
    supabase
      .from("toss_payments")
      .select("amount, credits, status, metadata")
      .in("status", [...SALES_STATUSES])
      .gte("created_at", monthStartIso),
    supabase
      .from("toss_payments")
      .select("amount, credits, status, metadata")
      .in("status", [...SALES_STATUSES]),
    supabase
      .from("toss_payments")
      .select(
        "id, order_name, amount, credits, created_at, user_id, status, metadata, user:users!toss_payments_user_id_public_users_fkey(email)",
      )
      .in("status", [...SALES_STATUSES])
      .order("created_at", { ascending: false })
      .limit(5),
    Promise.all(
      monthRanges.map((range) =>
        supabase
          .from("toss_payments")
          .select("amount, credits, status, metadata")
          .in("status", [...SALES_STATUSES])
          .gte("created_at", range.startIso)
          .lt("created_at", range.endIso),
      ),
    ),
  ]);

  const normalizedPaidPlanRows = (paidPlanRows || []) as UserPlanRow[];
  const paidUsers = normalizedPaidPlanRows.filter((plan) =>
    isActiveAccessPlan(plan.plan_type, plan.expires_at),
  ).length;

  const normalizedTodayPayments = ((todayPayments || []) as PaymentRow[]);
  const normalizedMonthPayments = ((monthPayments || []) as PaymentRow[]);
  const normalizedAllPayments = ((allPayments || []) as PaymentRow[]);
  const normalizedRecentPayments = ((recentPayments || []) as PaymentRow[]);

  const salesToday = normalizedTodayPayments.length;
  const revenueToday = normalizedTodayPayments.reduce(
    (sum, payment) => sum + getNetRevenue(payment),
    0,
  );
  const monthlyRevenue = normalizedMonthPayments.reduce(
    (sum, payment) => sum + getNetRevenue(payment),
    0,
  );
  const totalRevenue = normalizedAllPayments.reduce(
    (sum, payment) => sum + getNetRevenue(payment),
    0,
  );

  const chartData = monthRanges.map((range, index) => {
    const payments = ((monthlyPaymentSets[index].data || []) as PaymentRow[]);
    return {
      name: formatMonthLabel(range.start),
      mrr: payments.reduce((sum, payment) => sum + getNetRevenue(payment), 0),
    };
  });

  return {
    totalUsers: totalUsers || 0,
    paidUsers,
    salesToday,
    revenueToday,
    monthlyRevenue,
    totalRevenue,
    chartData,
    recentPayments: normalizedRecentPayments,
  };
}

async function getMarketingStats() {
  const supabase = createAdminClient();
  const { startIso: todayStartIso, endIso: tomorrowStartIso } = getKstDayRange();

  const { data: sessions } = await supabase
    .from("marketing_sessions")
    .select("duration_seconds, pricing_views, cta_clicks, referrer, first_path, first_seen_at")
    .gte("first_seen_at", todayStartIso)
    .lt("first_seen_at", tomorrowStartIso)
    .order("first_seen_at", { ascending: false });

  const rows = (sessions || []) as MarketingSessionRow[];
  const totalSessions = rows.length;
  const pricingSessions = rows.filter((row) => (row.pricing_views || 0) > 0).length;
  const ctaClicks = rows.reduce((sum, row) => sum + (row.cta_clicks || 0), 0);
  const avgDurationSeconds = totalSessions
    ? Math.round(
        rows.reduce((sum, row) => sum + (row.duration_seconds || 0), 0) / totalSessions,
      )
    : 0;

  return {
    totalSessions,
    pricingSessions,
    ctaClicks,
    avgDurationSeconds,
    recentSessions: rows.slice(0, 5),
  };
}

export default async function AdminOverviewPage() {
  const [stats, marketing] = await Promise.all([getAdminStats(), getMarketingStats()]);
  const conversionRate = stats.totalUsers > 0 ? (stats.paidUsers / stats.totalUsers) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">개요</h1>
        <p className="text-sm text-muted-foreground">
          실결제와 실제 랜딩 유입 기준으로 다시 집계한 운영 개요입니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 순매출</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              누적 순매출: {formatCurrency(stats.totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">활성 유료: {stats.paidUsers}명</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 실결제</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.salesToday}건</div>
            <p className="text-xs text-muted-foreground">
              오늘 순매출: {formatCurrency(stats.revenueToday)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">유료 전환율</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.paidUsers} / {stats.totalUsers}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 랜딩 세션</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{marketing.totalSessions}</div>
            <p className="text-xs text-muted-foreground">랜딩과 가격 페이지 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 가격 진입</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{marketing.pricingSessions}</div>
            <p className="text-xs text-muted-foreground">pricing 페이지까지 이동한 세션</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 체류시간</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {marketing.avgDurationSeconds}초
            </div>
            <p className="text-xs text-muted-foreground">오늘 세션 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTA 클릭</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{marketing.ctaClicks}</div>
            <p className="text-xs text-muted-foreground">가격 진입 및 결제 유도 클릭 수</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <AdminChart data={stats.chartData} />
        </div>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>최근 실결제</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-none text-foreground">
                      {getPaymentEmail(payment.user, payment.user_id)}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{payment.order_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(payment.created_at).toLocaleString("ko-KR", {
                        timeZone: SEOUL_TIME_ZONE,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-foreground">
                      {formatCurrency(getNetRevenue(payment))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {payment.status === "PARTIAL_CANCELLED" ? "부분취소 반영" : "완료"}
                    </p>
                  </div>
                </div>
              ))}

              {!stats.recentPayments.length && (
                <p className="text-sm text-muted-foreground">최근 실결제 내역이 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 랜딩 세션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketing.recentSessions.map((session, index) => (
              <div key={`${session.first_seen_at}-${index}`} className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {session.first_path || "/"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.referrer || "direct"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(session.first_seen_at).toLocaleString("ko-KR", {
                      timeZone: SEOUL_TIME_ZONE,
                    })}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{session.duration_seconds || 0}초</div>
                  <div>pricing {session.pricing_views || 0}</div>
                  <div>cta {session.cta_clicks || 0}</div>
                </div>
              </div>
            ))}

            {!marketing.recentSessions.length && (
              <p className="text-sm text-muted-foreground">오늘 수집된 랜딩 세션이 없습니다.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
