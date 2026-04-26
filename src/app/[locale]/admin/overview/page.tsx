import { Clock3, Coins, CreditCard, Eye, MousePointerClick, TrendingUp, UserPlus, Users } from "lucide-react";

import { AdminChart } from "@/components/admin/AdminChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getInternalAdminUsers } from "@/lib/admin/internal-users";
import { isActiveAccessPlan, PAID_PLAN_TYPES } from "@/lib/plans/config";
import { createAdminClient } from "@/utils/supabase/admin";

const SALES_STATUSES = ["DONE", "PARTIAL_CANCELLED"] as const;
const SEOUL_TIME_ZONE = "Asia/Seoul";
const LAUNCH_OPEN_AT_KST = "2026-04-24T17:00:00+09:00";
const MARKETING_PERIODS = {
  today: { label: "오늘", caption: "오늘 기준" },
  "7d": { label: "최근 7일", caption: "최근 7일 기준" },
  "30d": { label: "최근 30일", caption: "최근 30일 기준" },
} as const;

type SalesStatus = (typeof SALES_STATUSES)[number];
type MarketingPeriod = keyof typeof MARKETING_PERIODS;

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
  user_id: string;
  plan_type: string | null;
  expires_at: string | null;
}

interface UserRow {
  id: string;
  created_at: string;
}

interface LaunchPaymentRow {
  id: string;
  amount: number;
  created_at: string;
  user_id: string;
  status: string;
  metadata: Record<string, unknown> | null;
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

function getKstMarketingRange(period: MarketingPeriod) {
  if (period === "today") {
    return getKstDayRange();
  }

  const { year, month, day } = getKstDateParts();
  const end = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
  end.setUTCDate(end.getUTCDate() + 1);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (period === "7d" ? 7 : 30));

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function normalizeMarketingPeriod(value?: string): MarketingPeriod {
  if (value === "7d" || value === "30d") return value;
  return "today";
}

function getNumericMetadata(metadata: Record<string, unknown> | null | undefined, key: string) {
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

function getNetRevenue(payment: {
  amount: number;
  status: string;
  metadata: Record<string, unknown> | null;
}) {
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

function getLaunchOpenAtIso() {
  return new Date(LAUNCH_OPEN_AT_KST).toISOString();
}

function getLaunchOpenAtLabel() {
  return new Date(LAUNCH_OPEN_AT_KST).toLocaleString("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
  });
}

async function getAdminStats() {
  const supabase = createAdminClient();
  const internalAdmins = await getInternalAdminUsers();
  const internalAdminIds = new Set(internalAdmins.map((user) => user.id));

  const { startIso: todayStartIso, endIso: tomorrowStartIso } = getKstDayRange();
  const { startIso: monthStartIso } = getKstMonthRange();
  const monthRanges = Array.from({ length: 6 }, (_, index) => getKstMonthRange(index - 5));

  const paymentSelect =
    "id, order_name, amount, credits, created_at, user_id, status, metadata, user:users!toss_payments_user_id_public_users_fkey(email)";

  const [
    { count: totalUsersRaw },
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
      .select("user_id, plan_type, expires_at")
      .in("plan_type", [...PAID_PLAN_TYPES]),
    supabase
      .from("toss_payments")
      .select(paymentSelect)
      .in("status", [...SALES_STATUSES])
      .gte("created_at", todayStartIso)
      .lt("created_at", tomorrowStartIso),
    supabase
      .from("toss_payments")
      .select(paymentSelect)
      .in("status", [...SALES_STATUSES])
      .gte("created_at", monthStartIso),
    supabase.from("toss_payments").select(paymentSelect).in("status", [...SALES_STATUSES]),
    supabase
      .from("toss_payments")
      .select(paymentSelect)
      .in("status", [...SALES_STATUSES])
      .order("created_at", { ascending: false })
      .limit(20),
    Promise.all(
      monthRanges.map((range) =>
        supabase
          .from("toss_payments")
          .select(paymentSelect)
          .in("status", [...SALES_STATUSES])
          .gte("created_at", range.startIso)
          .lt("created_at", range.endIso),
      ),
    ),
  ]);

  const normalizedPaidPlanRows = (paidPlanRows || []) as UserPlanRow[];
  const paidUsers = normalizedPaidPlanRows.filter(
    (plan) =>
      !internalAdminIds.has(plan.user_id) &&
      isActiveAccessPlan(plan.plan_type, plan.expires_at),
  ).length;

  const filterExternalPayments = (payments: PaymentRow[]) =>
    payments.filter((payment) => !internalAdminIds.has(payment.user_id));

  const normalizedTodayPayments = filterExternalPayments((todayPayments || []) as PaymentRow[]);
  const normalizedMonthPayments = filterExternalPayments((monthPayments || []) as PaymentRow[]);
  const normalizedAllPayments = filterExternalPayments((allPayments || []) as PaymentRow[]);
  const normalizedRecentPayments = filterExternalPayments((recentPayments || []) as PaymentRow[]).slice(
    0,
    5,
  );

  const salesToday = normalizedTodayPayments.length;
  const revenueToday = normalizedTodayPayments.reduce((sum, payment) => sum + getNetRevenue(payment), 0);
  const monthlyRevenue = normalizedMonthPayments.reduce(
    (sum, payment) => sum + getNetRevenue(payment),
    0,
  );
  const totalRevenue = normalizedAllPayments.reduce((sum, payment) => sum + getNetRevenue(payment), 0);

  const chartData = monthRanges.map((range, index) => {
    const payments = filterExternalPayments((monthlyPaymentSets[index].data || []) as PaymentRow[]);
    return {
      name: formatMonthLabel(range.start),
      mrr: payments.reduce((sum, payment) => sum + getNetRevenue(payment), 0),
    };
  });

  return {
    totalUsers: Math.max(0, (totalUsersRaw || 0) - internalAdmins.length),
    paidUsers,
    salesToday,
    revenueToday,
    monthlyRevenue,
    totalRevenue,
    chartData,
    recentPayments: normalizedRecentPayments,
  };
}

async function getMarketingStats(period: MarketingPeriod) {
  const supabase = createAdminClient();
  const { startIso, endIso } = getKstMarketingRange(period);

  const { data: sessions } = await supabase
    .from("marketing_sessions")
    .select("duration_seconds, pricing_views, cta_clicks, referrer, first_path, first_seen_at")
    .gte("first_seen_at", startIso)
    .lt("first_seen_at", endIso)
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

async function getLaunchStats() {
  const supabase = createAdminClient();
  const internalAdmins = await getInternalAdminUsers();
  const internalAdminIds = new Set(internalAdmins.map((user) => user.id));
  const launchStartIso = getLaunchOpenAtIso();

  const [{ data: sessions }, { data: users }, { data: payments }] = await Promise.all([
    supabase
      .from("marketing_sessions")
      .select("cta_clicks, first_seen_at")
      .gte("first_seen_at", launchStartIso),
    supabase.from("users").select("id, created_at").gte("created_at", launchStartIso),
    supabase
      .from("toss_payments")
      .select("id, amount, created_at, user_id, status, metadata")
      .gte("created_at", launchStartIso),
  ]);

  const launchPayments = ((payments || []) as LaunchPaymentRow[]).filter(
    (payment) =>
      !internalAdminIds.has(payment.user_id) &&
      payment.metadata?.provider === "tosspay-direct",
  );
  const launchSessions = (sessions || []) as Array<Pick<MarketingSessionRow, "cta_clicks" | "first_seen_at">>;
  const launchUsers = ((users || []) as UserRow[]).filter((user) => !internalAdminIds.has(user.id));
  const completedPayments = launchPayments.filter((payment) =>
    (SALES_STATUSES as readonly string[]).includes(payment.status),
  );
  const pendingPayments = launchPayments.filter((payment) => payment.status === "PENDING");

  return {
    openedAtLabel: getLaunchOpenAtLabel(),
    landingSessions: launchSessions.length,
    ctaUnique: launchSessions.filter((session) => (session.cta_clicks || 0) > 0).length,
    ctaClicks: launchSessions.reduce((sum, session) => sum + (session.cta_clicks || 0), 0),
    signups: launchUsers.length,
    paymentAttempts: launchPayments.length,
    paymentPending: pendingPayments.length,
    paymentCompleted: completedPayments.length,
    revenue: completedPayments.reduce((sum, payment) => sum + getNetRevenue(payment), 0),
  };
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const marketingPeriod = normalizeMarketingPeriod(period);
  const [stats, marketing, launch] = await Promise.all([
    getAdminStats(),
    getMarketingStats(marketingPeriod),
    getLaunchStats(),
  ]);
  const conversionRate = stats.totalUsers > 0 ? (stats.paidUsers / stats.totalUsers) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">개요</h1>
        <p className="text-sm text-muted-foreground">
          내부 관리자 계정을 제외한 실결제와 실제 랜딩 유입 기준 운영 개요입니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 순매출</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.monthlyRevenue)}</div>
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
            <div className="text-2xl font-bold text-foreground">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.paidUsers} / {stats.totalUsers}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">런칭 기준 현황</h2>
          <p className="text-xs text-muted-foreground">
            {launch.openedAtLabel} 오픈 이후, TossPay Direct만 집계한 숫자입니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">런칭 이후 랜딩</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{launch.landingSessions}</div>
              <p className="text-xs text-muted-foreground">오픈 이후 누적 방문 세션</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">런칭 이후 CTA</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{launch.ctaUnique}</div>
              <p className="text-xs text-muted-foreground">유니크 {launch.ctaUnique} / 총 클릭 {launch.ctaClicks}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">런칭 이후 가입</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{launch.signups}</div>
              <p className="text-xs text-muted-foreground">내부 관리자 제외 신규 가입</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">결제 시도</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{launch.paymentAttempts}</div>
              <p className="text-xs text-muted-foreground">TossPay Direct 생성 주문</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PENDING</CardTitle>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{launch.paymentPending}</div>
              <p className="text-xs text-muted-foreground">결제창 진입 후 미완료 상태</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">결제 완료</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{launch.paymentCompleted}</div>
              <p className="text-xs text-muted-foreground">DONE / PARTIAL_CANCELLED 기준</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">런칭 매출</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(launch.revenue)}</div>
              <p className="text-xs text-muted-foreground">TossPay Direct 완료 기준</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">랜딩 유입</h2>
            <p className="text-xs text-muted-foreground">랜딩·가격 페이지 방문과 CTA 기준</p>
          </div>
          <div className="inline-flex rounded-lg border bg-background p-1">
            {Object.entries(MARKETING_PERIODS).map(([key, config]) => {
              const active = key === marketingPeriod;
              return (
                <Link
                  key={key}
                  href={`/admin/overview?period=${key}`}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {config.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{MARKETING_PERIODS[marketingPeriod].label} 랜딩 세션</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{marketing.totalSessions}</div>
              <p className="text-xs text-muted-foreground">{MARKETING_PERIODS[marketingPeriod].caption}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{MARKETING_PERIODS[marketingPeriod].label} 가격 진입</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{marketing.pricingSessions}</div>
              <p className="text-xs text-muted-foreground">{MARKETING_PERIODS[marketingPeriod].caption}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 체류시간</CardTitle>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{marketing.avgDurationSeconds}초</div>
              <p className="text-xs text-muted-foreground">{MARKETING_PERIODS[marketingPeriod].caption}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CTA 클릭</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{marketing.ctaClicks}</div>
              <p className="text-xs text-muted-foreground">{MARKETING_PERIODS[marketingPeriod].caption}</p>
            </CardContent>
          </Card>
        </div>
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
                <p className="text-sm text-muted-foreground">외부 사용자 실결제 내역이 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{MARKETING_PERIODS[marketingPeriod].label} 랜딩 세션</CardTitle>
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
              <p className="text-sm text-muted-foreground">
                {MARKETING_PERIODS[marketingPeriod].caption} 수집된 랜딩 세션이 없습니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
