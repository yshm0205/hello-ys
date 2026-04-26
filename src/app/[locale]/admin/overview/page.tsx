import {
  Clock3,
  Coins,
  CreditCard,
  Eye,
  MousePointerClick,
  TrendingUp,
  UserPlus,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getInternalAdminUsers } from "@/lib/admin/internal-users";
import { createAdminClient } from "@/utils/supabase/admin";

const SALES_STATUSES = ["DONE", "PARTIAL_CANCELLED"] as const;
const SEOUL_TIME_ZONE = "Asia/Seoul";
const LAUNCH_OPEN_AT_KST = "2026-04-24T17:00:00+09:00";
const PERIOD_CONFIG = {
  launch: { label: "런칭 이후", caption: "오픈 이후 누적" },
  today: { label: "오늘", caption: "오늘 기준" },
  "7d": { label: "최근 7일", caption: "최근 7일 기준" },
  "30d": { label: "최근 30일", caption: "최근 30일 기준" },
} as const;
const LAUNCH_CHANGES = [
  {
    happenedAt: "4/25 새벽",
    title: "로그인/회원가입 후 체크아웃 복귀 수정",
    watch: "CTA → 결제 시도",
  },
  {
    happenedAt: "4/26 오전",
    title: "전자책 쿠폰 EBOOK50 적용",
    watch: "결제 시도 / 결제 완료",
  },
  {
    happenedAt: "4/26 저녁",
    title: "로그인·회원가입 화면 압축 및 문구 보강",
    watch: "CTA → 결제 시도",
  },
] as const;

type MarketingPeriod = keyof typeof PERIOD_CONFIG;

interface MarketingSessionRow {
  cta_clicks: number | null;
  referrer: string | null;
  first_seen_at: string;
}

interface UserRow {
  id: string;
  created_at: string;
}

interface PaymentRow {
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
  return {
    year: parts.find((part) => part.type === "year")?.value ?? "1970",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
  };
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

function getPeriodRange(period: MarketingPeriod) {
  if (period === "launch") {
    return {
      startIso: getLaunchOpenAtIso(),
      endIso: new Date().toISOString(),
    };
  }

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
  if (value === "launch" || value === "7d" || value === "30d") return value;
  return "today";
}

function getLaunchOpenAtIso() {
  return new Date(LAUNCH_OPEN_AT_KST).toISOString();
}

function getLaunchOpenAtLabel() {
  return new Date(LAUNCH_OPEN_AT_KST).toLocaleString("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
  });
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

  if (payment.status === "PARTIAL_CANCELLED") {
    const cancelledAmount = getNumericMetadata(payment.metadata, "cancelledAmount");
    return Math.max(0, payment.amount - cancelledAmount);
  }

  return 0;
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function getRate(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function normalizeReferrer(raw: string | null) {
  if (!raw) return "direct";

  const trimmed = raw.trim();
  if (!trimmed) return "direct";

  let hostname = trimmed;
  try {
    hostname = new URL(trimmed).hostname;
  } catch {
    hostname = trimmed.replace(/^https?:\/\//i, "").split("/")[0];
  }

  hostname = hostname.replace(/^www\./i, "").toLowerCase();

  if (hostname.includes("youtube") || hostname.includes("youtu.be")) return "YouTube";
  if (hostname.includes("google")) return "Google";
  if (hostname.includes("naver")) return "Naver";
  if (hostname.includes("kakao")) return "Kakao";
  if (hostname.includes("pay.toss.im")) return "pay.toss.im";
  return hostname || "direct";
}

function summarizeReferrers(rows: MarketingSessionRow[], topN = 3) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const source = normalizeReferrer(row.referrer);
    counts.set(source, (counts.get(source) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([source, count]) => ({ source, count }));
}

async function getInternalAdminIdSet() {
  const internalAdmins = await getInternalAdminUsers();
  return new Set(internalAdmins.map((user) => user.id));
}

async function getPeriodStats(period: MarketingPeriod) {
  const supabase = createAdminClient();
  const internalAdminIds = await getInternalAdminIdSet();
  const range = getPeriodRange(period);

  const [{ data: sessions }, { data: users }, { data: payments }] = await Promise.all([
    supabase
      .from("marketing_sessions")
      .select("cta_clicks, referrer, first_seen_at")
      .gte("first_seen_at", range.startIso)
      .lt("first_seen_at", range.endIso),
    supabase
      .from("users")
      .select("id, created_at")
      .gte("created_at", range.startIso)
      .lt("created_at", range.endIso),
    supabase
      .from("toss_payments")
      .select("id, amount, created_at, user_id, status, metadata")
      .gte("created_at", range.startIso)
      .lt("created_at", range.endIso),
  ]);

  const periodSessions = (sessions || []) as MarketingSessionRow[];
  const periodUsers = ((users || []) as UserRow[]).filter((user) => !internalAdminIds.has(user.id));
  const periodPayments = ((payments || []) as PaymentRow[]).filter(
    (payment) =>
      !internalAdminIds.has(payment.user_id) &&
      payment.metadata?.provider === "tosspay-direct",
  );

  const completedPayments = periodPayments.filter((payment) =>
    (SALES_STATUSES as readonly string[]).includes(payment.status),
  );
  const pendingPayments = periodPayments.filter((payment) => payment.status === "PENDING");

  return {
    openedAtLabel: getLaunchOpenAtLabel(),
    landingSessions: periodSessions.length,
    ctaUnique: periodSessions.filter((session) => (session.cta_clicks || 0) > 0).length,
    ctaClicks: periodSessions.reduce((sum, session) => sum + (session.cta_clicks || 0), 0),
    signups: periodUsers.length,
    paymentAttempts: periodPayments.length,
    paymentPending: pendingPayments.length,
    paymentCompleted: completedPayments.length,
    revenue: completedPayments.reduce((sum, payment) => sum + getNetRevenue(payment), 0),
    topReferrers: summarizeReferrers(periodSessions, 3),
  };
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const marketingPeriod = normalizeMarketingPeriod(period);
  const periodStats = await getPeriodStats(marketingPeriod);
  const periodConfig = PERIOD_CONFIG[marketingPeriod];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">개요</h1>
        <p className="text-sm text-muted-foreground">
          선택한 기간 기준 퍼널과 핵심 숫자만 빠르게 보는 화면입니다.
        </p>
        <div className="inline-flex rounded-lg border bg-background p-1">
          {Object.entries(PERIOD_CONFIG).map(([key, config]) => {
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

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">주요 수정</h2>
          <p className="text-xs text-muted-foreground">
            수정 직후에는 아래 지표가 같이 움직이는지 먼저 보면 됩니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {LAUNCH_CHANGES.map((change) => (
            <Card key={`${change.happenedAt}-${change.title}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{change.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-xs font-medium text-foreground">{change.happenedAt}</p>
                <p className="text-xs text-muted-foreground">봐야 할 지표: {change.watch}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{periodConfig.label} 퍼널</h2>
          <p className="text-xs text-muted-foreground">
            {marketingPeriod === "launch"
              ? `${periodStats.openedAtLabel} 오픈 이후`
              : periodConfig.caption}{" "}
            · TossPay Direct · 내부 계정 제외
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">랜딩 방문</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{periodStats.landingSessions}</div>
              <p className="text-xs text-muted-foreground">{periodConfig.caption} 방문 세션</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CTA 유니크</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{periodStats.ctaUnique}</div>
              <p className="text-xs text-muted-foreground">총 클릭 {periodStats.ctaClicks}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">결제 시도</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{periodStats.paymentAttempts}</div>
              <p className="text-xs text-muted-foreground">TossPay Direct 생성 주문</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">결제 완료</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{periodStats.paymentCompleted}</div>
              <p className="text-xs text-muted-foreground">DONE / PARTIAL_CANCELLED 기준</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">런칭 매출</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(periodStats.revenue)}</div>
              <p className="text-xs text-muted-foreground">완료 결제 기준</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">어디서 빠지는지</h2>
          <p className="text-xs text-muted-foreground">가입보다 랜딩 기준 퍼널을 먼저 보면 됩니다.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">랜딩 → CTA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {getRate(periodStats.ctaUnique, periodStats.landingSessions)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {periodStats.landingSessions}명 중 {periodStats.ctaUnique}명
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">CTA → 결제 시도</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {getRate(periodStats.paymentAttempts, periodStats.ctaUnique)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {periodStats.ctaUnique}명 중 {periodStats.paymentAttempts}건
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">결제 시도 → 완료</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {getRate(periodStats.paymentCompleted, periodStats.paymentAttempts)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {periodStats.paymentAttempts}건 중 {periodStats.paymentCompleted}건
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">보조 정보</h2>
          <p className="text-xs text-muted-foreground">메인 판단은 위 퍼널로 하고, 아래는 참고용으로 봅니다.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{periodConfig.label} 가입</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{periodStats.signups}</div>
              <p className="text-xs text-muted-foreground">내부 관리자 제외 신규 가입</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PENDING</CardTitle>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{periodStats.paymentPending}</div>
              <p className="text-xs text-muted-foreground">결제창 진입 후 아직 완료 안 된 건</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">주요 유입</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {periodStats.topReferrers.map((referrer) => (
                <div
                  key={referrer.source}
                  className="flex items-center justify-between text-sm text-foreground"
                >
                  <span>{referrer.source}</span>
                  <span className="font-medium">{referrer.count}</span>
                </div>
              ))}
              {!periodStats.topReferrers.length && (
                <p className="text-xs text-muted-foreground">아직 유입 데이터가 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
