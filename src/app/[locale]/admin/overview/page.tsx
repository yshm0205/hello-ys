import {
  Clock3,
  Coins,
  CreditCard,
  Eye,
  MousePointerClick,
  TrendingUp,
  UserPlus,
} from "lucide-react";

import { AdminOverviewLiveRefresh } from "@/components/admin/AdminOverviewLiveRefresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getInternalAdminUsers } from "@/lib/admin/internal-users";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SALES_STATUSES = ["DONE", "PARTIAL_CANCELLED"] as const;
const SEOUL_TIME_ZONE = "Asia/Seoul";
const LAUNCH_OPEN_AT_KST = "2026-04-24T17:00:00+09:00";
const BEHAVIOR_TRACKING_RELIABLE_FROM_KST = "2026-04-30T12:40:00+09:00";
const BEHAVIOR_TRACKING_RELIABLE_FROM_LABEL = "4/30 12:40 이후";
const PERIOD_CONFIG = {
  launch: { label: "런칭 이후", caption: "오픈 이후 누적" },
  today: { label: "오늘", caption: "오늘 기준" },
  "7d": { label: "최근 7일", caption: "최근 7일 기준" },
  "30d": { label: "최근 30일", caption: "최근 30일 기준" },
} as const;
const LAUNCH_CHANGES = [
  {
    happenedAt: "4/25 새벽",
    title: "로그인·회원가입 후 체크아웃 복귀 수정",
    watch: "CTA → 결제 시도",
  },
  {
    happenedAt: "4/26 오전",
    title: "전자책 쿠폰 EBOOK50 적용",
    watch: "결제 시도 / 결제 완료",
  },
  {
    happenedAt: "4/26 저녁",
    title: "로그인 화면 압축 및 안내 문구 보강",
    watch: "CTA → 결제 시도",
  },
  {
    happenedAt: "4/27 오후",
    title: "결제 후 강의실 자동 이동 및 구매자 CTA 분기",
    watch: "결제 완료 후 문의 / 홈 재방문 흐름",
  },
] as const;
const SECTION_INFOS: Record<
  string,
  { label: string; exitLabel?: string; range: string; check: string }
> = {
  "landing-hero": {
    label: "첫 화면",
    exitLabel: "첫 화면 이탈",
    range: "상단 혜택 문구부터 첫 신청 버튼까지",
    check: "헤드라인, 첫 CTA, 아래로 더 보게 만드는 문구",
  },
  earlybird: {
    label: "얼리버드 혜택",
    range: "1차 얼리버드 자리·가격·보너스 안내부터 신청 버튼까지",
    check: "가격, 혜택, 선착순 메시지가 바로 이해되는지",
  },
  "loop-pain": {
    label: "문제 인식",
    range: "무한 루프 그림부터 '갇혀 계신가요?' 문구까지",
    check: "문제 공감이 충분히 빠르게 되는지",
  },
  pain: {
    label: "문제 공감",
    range: "먼 길을 돌아가는 중 문구부터 3가지 문제 카드까지",
    check: "문제 카드가 길거나 공감이 약하지 않은지",
  },
  offer: {
    label: "상품 소개",
    range:
      "최단거리 소개부터 AI 도구, 채널 리스트, VOD 40강, 전자책, 노션 템플릿, 시간 절약 요약까지",
    check: "구성품이 많아 보이거나 핵심 혜택이 흐려지지 않는지",
  },
  compare: {
    label: "가치 비교",
    range: "가격 질문부터 300만원 가치·가격 비교 설명까지",
    check: "가격 설득과 가치 비교가 납득되는지",
  },
  "how-it-works": {
    label: "진행 방식",
    range: "어디서 헤매는지 질문부터 단계별 솔루션 안내까지",
    check: "수강 흐름이 복잡해 보이지 않는지",
  },
  faq: {
    label: "FAQ",
    range: "자주 묻는 질문부터 수강·결제·환불 답변까지",
    check: "불안 요소가 FAQ에서 해소되는지",
  },
  "floating-cta-mobile": {
    label: "고정 CTA(모바일 하단)",
    range: "모바일 화면 하단에 고정된 얼리버드 신청 버튼",
    check: "하단 고정 버튼이 실제 결제 클릭을 만들고 있는지",
  },
  "floating-cta-desktop": {
    label: "고정 CTA(PC 우측)",
    range: "PC 화면 오른쪽에 고정된 얼리버드 신청 카드",
    check: "우측 고정 버튼이 방해보다 클릭을 만들고 있는지",
  },
  cta: {
    label: "마지막 신청",
    range: "마지막 시작 문구부터 최종 신청 버튼까지",
    check: "마지막 CTA 문구와 마감감이 충분한지",
  },
};
const BASE_SESSION_SELECT = "cta_clicks, referrer, first_seen_at, duration_seconds";
const BEHAVIOR_SESSION_SELECT = `${BASE_SESSION_SELECT}, duration_seconds, max_scroll_percent, last_visible_section, last_clicked_cta_section`;

type PresetMarketingPeriod = keyof typeof PERIOD_CONFIG;
type MarketingPeriod = PresetMarketingPeriod | "custom";

interface MarketingSessionRow {
  cta_clicks: number | null;
  referrer: string | null;
  first_seen_at: string;
  duration_seconds: number | null;
  max_scroll_percent: number | null;
  last_visible_section: string | null;
  last_clicked_cta_section: string | null;
}

interface LandingSectionSummary {
  raw: string;
  label: string;
  exitLabel: string;
  range: string;
  check: string;
  count: number;
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

function isValidDateInput(value?: string) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function hasOrderedDateRange(startDate?: string, endDate?: string) {
  if (!isValidDateInput(startDate) || !isValidDateInput(endDate)) {
    return false;
  }

  return (startDate as string) <= (endDate as string);
}

function getDateInputValueFromIso(dateIso: string, subtractDays = 0) {
  const date = new Date(dateIso);
  if (subtractDays) {
    date.setUTCDate(date.getUTCDate() - subtractDays);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getLaunchOpenAtIso() {
  return new Date(LAUNCH_OPEN_AT_KST).toISOString();
}

function getLaunchOpenAtLabel() {
  return new Date(LAUNCH_OPEN_AT_KST).toLocaleString("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
  });
}

function isReliableBehaviorSession(session: MarketingSessionRow) {
  if (!session.first_seen_at) return false;
  return (
    new Date(session.first_seen_at).getTime() >=
    new Date(BEHAVIOR_TRACKING_RELIABLE_FROM_KST).getTime()
  );
}

function getPeriodRange(period: MarketingPeriod, startDate?: string, endDate?: string) {
  if (period === "custom" && hasOrderedDateRange(startDate, endDate)) {
    const start = new Date(`${startDate}T00:00:00+09:00`);
    const end = new Date(`${endDate}T00:00:00+09:00`);
    end.setUTCDate(end.getUTCDate() + 1);

    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }

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

function normalizeMarketingPeriod(
  value?: string,
  startDate?: string,
  endDate?: string,
): MarketingPeriod {
  if (hasOrderedDateRange(startDate, endDate)) return "custom";
  if (value === "launch" || value === "7d" || value === "30d") return value;
  return "today";
}

function getPeriodMeta(period: MarketingPeriod, startDate?: string, endDate?: string) {
  if (period === "custom" && hasOrderedDateRange(startDate, endDate)) {
    return {
      label: "직접 선택",
      caption: `${startDate as string} ~ ${endDate as string}`,
    };
  }

  return PERIOD_CONFIG[period as PresetMarketingPeriod];
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

function getNetRevenue(payment: PaymentRow) {
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

function formatDuration(seconds: number) {
  if (!seconds) return "0초";

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;

  if (!minutes) return `${remainSeconds}초`;
  if (!remainSeconds) return `${minutes}분`;
  return `${minutes}분 ${remainSeconds}초`;
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

function getSectionInfo(section: string) {
  const info = SECTION_INFOS[section];

  return {
    label: info?.label || section,
    exitLabel: info?.exitLabel || info?.label || section,
    range: info?.range || "랜딩의 해당 구간",
    check: info?.check || "해당 구간의 카피와 CTA 흐름",
  };
}

function summarizeTopSections(
  rows: MarketingSessionRow[],
  selector: (row: MarketingSessionRow) => string | null,
  limit = 3,
) {
  const counts = new Map<string, LandingSectionSummary>();

  for (const row of rows) {
    const raw = selector(row);
    if (!raw) continue;
    const info = getSectionInfo(raw);
    const current = counts.get(raw) || { raw, ...info, count: 0 };
    current.count += 1;
    counts.set(raw, current);
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function summarizeTopSection(
  rows: MarketingSessionRow[],
  selector: (row: MarketingSessionRow) => string | null,
) {
  return summarizeTopSections(rows, selector, 1)[0] || null;
}

function getExitSectionLabel(section: LandingSectionSummary | null) {
  if (!section) return "-";
  return section.exitLabel;
}

function getExitSectionHint(section: LandingSectionSummary | null) {
  if (!section) return "아직 데이터 없음";
  return `${section.count}세션 · ${section.range}`;
}

function isMissingBehaviorFieldError(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String(error.message)
      : String(error || "");

  return (
    message.includes("duration_seconds") ||
    message.includes("max_scroll_percent") ||
    message.includes("last_visible_section") ||
    message.includes("last_clicked_cta_section")
  );
}

async function getInternalAdminIdSet() {
  const internalAdmins = await getInternalAdminUsers();
  return new Set(internalAdmins.map((user) => user.id));
}

async function getPeriodStats(period: MarketingPeriod, startDate?: string, endDate?: string) {
  const supabase = createAdminClient();
  const internalAdminIds = await getInternalAdminIdSet();
  const range = getPeriodRange(period, startDate, endDate);

  let sessionsResponse: {
    data: Partial<MarketingSessionRow>[] | null;
    error: unknown;
  } = (await supabase
    .from("marketing_sessions")
    .select(BEHAVIOR_SESSION_SELECT)
    .gte("first_seen_at", range.startIso)
    .lt("first_seen_at", range.endIso)) as {
    data: Partial<MarketingSessionRow>[] | null;
    error: unknown;
  };

  if (sessionsResponse.error && isMissingBehaviorFieldError(sessionsResponse.error)) {
    sessionsResponse = (await supabase
      .from("marketing_sessions")
      .select(BASE_SESSION_SELECT)
      .gte("first_seen_at", range.startIso)
      .lt("first_seen_at", range.endIso)) as typeof sessionsResponse;
  }

  const [{ data: users }, { data: payments }] = await Promise.all([
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

  if (sessionsResponse.error) {
    throw sessionsResponse.error;
  }

  const periodSessions = ((sessionsResponse.data || []) as Partial<MarketingSessionRow>[]).map(
    (session) => ({
      cta_clicks: session.cta_clicks ?? 0,
      referrer: session.referrer ?? null,
      first_seen_at: session.first_seen_at ?? "",
      duration_seconds: session.duration_seconds ?? 0,
      max_scroll_percent: session.max_scroll_percent ?? 0,
      last_visible_section: session.last_visible_section ?? null,
      last_clicked_cta_section: session.last_clicked_cta_section ?? null,
    }),
  );
  const periodUsers = ((users || []) as UserRow[]).filter(
    (user) => !internalAdminIds.has(user.id),
  );
  const periodPayments = ((payments || []) as PaymentRow[]).filter(
    (payment) =>
      !internalAdminIds.has(payment.user_id) &&
      payment.metadata?.provider === "tosspay-direct",
  );

  const completedPayments = periodPayments.filter((payment) =>
    (SALES_STATUSES as readonly string[]).includes(payment.status),
  );
  const pendingPayments = periodPayments.filter(
    (payment) => payment.status === "PENDING",
  );
  const ctaUnique = periodSessions.filter((session) => (session.cta_clicks || 0) > 0).length;

  const averageDurationSeconds = periodSessions.length
    ? Math.round(
        periodSessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) /
          periodSessions.length,
      )
    : 0;

  const averageMaxScrollPercent = periodSessions.length
    ? Math.round(
        periodSessions.reduce((sum, session) => sum + (session.max_scroll_percent || 0), 0) /
          periodSessions.length,
      )
    : 0;

  const hasBehaviorSignals = periodSessions.some(
    (session) =>
      (session.max_scroll_percent || 0) > 0 ||
      !!session.last_visible_section ||
      !!session.last_clicked_cta_section,
  );
  const reliableBehaviorSessions = periodSessions.filter(isReliableBehaviorSession);
  const reliableCtaSessions = reliableBehaviorSessions.filter(
    (session) => (session.cta_clicks || 0) > 0,
  );
  const hasReliableBehaviorSignals = reliableBehaviorSessions.some(
    (session) => !!session.last_visible_section || !!session.last_clicked_cta_section,
  );

  return {
    openedAtLabel: getLaunchOpenAtLabel(),
    behaviorReliableFromLabel: BEHAVIOR_TRACKING_RELIABLE_FROM_LABEL,
    reliableBehaviorSessionCount: reliableBehaviorSessions.length,
    landingSessions: periodSessions.length,
    ctaUnique,
    ctaClicks: periodSessions.reduce((sum, session) => sum + (session.cta_clicks || 0), 0),
    signups: periodUsers.length,
    paymentAttempts: periodPayments.length,
    paymentPending: pendingPayments.length,
    paymentCompleted: completedPayments.length,
    revenue: completedPayments.reduce((sum, payment) => sum + getNetRevenue(payment), 0),
    topReferrers: summarizeReferrers(periodSessions, 3),
    averageDurationSeconds,
    averageMaxScrollPercent,
    hasBehaviorSignals,
    hasReliableBehaviorSignals,
    topExitSection: summarizeTopSection(
      reliableBehaviorSessions,
      (session) => session.last_visible_section,
    ),
    topExitSections: summarizeTopSections(
      reliableBehaviorSessions,
      (session) => session.last_visible_section,
      3,
    ),
    topCtaSection: summarizeTopSection(
      reliableCtaSessions,
      (session) => session.last_clicked_cta_section,
    ),
    topCtaSections: summarizeTopSections(
      reliableCtaSessions,
      (session) => session.last_clicked_cta_section,
      3,
    ),
  };
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}) {
  const { period, start, end } = await searchParams;
  const marketingPeriod = normalizeMarketingPeriod(period, start, end);
  const periodStats = await getPeriodStats(marketingPeriod, start, end);
  const periodConfig = getPeriodMeta(marketingPeriod, start, end);
  const activeRange = getPeriodRange(marketingPeriod, start, end);
  const dateFromValue =
    marketingPeriod === "custom" && isValidDateInput(start)
      ? start
      : getDateInputValueFromIso(activeRange.startIso);
  const dateToValue =
    marketingPeriod === "custom" && isValidDateInput(end)
      ? end
      : getDateInputValueFromIso(activeRange.endIso, 1);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">개요</h1>
        <p className="text-sm text-muted-foreground">
          선택한 기간 기준으로 런칭 퍼널과 핵심 숫자만 빠르게 보는 화면입니다.
        </p>
        <div className="flex flex-wrap items-end gap-3">
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

          <form method="get" className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="period" value="custom" />
            <label className="grid gap-1 text-xs text-muted-foreground">
              시작일
              <input
                type="date"
                name="start"
                defaultValue={dateFromValue}
                className="h-9 rounded-md border bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              종료일
              <input
                type="date"
                name="end"
                defaultValue={dateToValue}
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
        </div>
        <AdminOverviewLiveRefresh />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">주요 수정</h2>
          <p className="text-xs text-muted-foreground">
            수정 직후에는 아래 지표가 같이 움직이는지 먼저 보면 됩니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {LAUNCH_CHANGES.map((change) => (
            <Card key={`${change.happenedAt}-${change.title}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{change.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-xs font-medium text-foreground">{change.happenedAt}</p>
                <p className="text-xs text-muted-foreground">
                  봐야 할 지표: {change.watch}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {periodConfig.label} 퍼널
          </h2>
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
              <div className="text-2xl font-bold text-foreground">
                {periodStats.landingSessions}
              </div>
              <p className="text-xs text-muted-foreground">
                {periodConfig.caption} 방문 세션
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CTA 유니크</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{periodStats.ctaUnique}</div>
              <p className="text-xs text-muted-foreground">
                총 클릭 {periodStats.ctaClicks}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">결제 시도</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {periodStats.paymentAttempts}
              </div>
              <p className="text-xs text-muted-foreground">
                TossPay Direct 생성 주문
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">결제 완료</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {periodStats.paymentCompleted}
              </div>
              <p className="text-xs text-muted-foreground">
                DONE / PARTIAL_CANCELLED 기준
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">실결제 매출</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(periodStats.revenue)}
              </div>
              <p className="text-xs text-muted-foreground">완료 결제 기준</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">어디서 빠지는지</h2>
          <p className="text-xs text-muted-foreground">
            가입보다 랜딩 기준 퍼널을 먼저 보면 됩니다.
          </p>
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
          <h2 className="text-base font-semibold text-foreground">랜딩 행동 요약</h2>
          <p className="text-xs text-muted-foreground">
            이탈 위치와 클릭 위치는 {periodStats.behaviorReliableFromLabel} 새 데이터만 봅니다.
            현재 표본 {periodStats.reliableBehaviorSessionCount}세션.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 체류 시간</CardTitle>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatDuration(periodStats.averageDurationSeconds)}
              </div>
              <p className="text-xs text-muted-foreground">
                {periodStats.hasBehaviorSignals
                  ? `평균 최대 스크롤 ${periodStats.averageMaxScrollPercent}%`
                  : "새 행동 추적은 지금부터 반영됩니다"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이탈 위치</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {getExitSectionLabel(periodStats.topExitSection)}
              </div>
              <p className="text-xs text-muted-foreground">
                {periodStats.hasReliableBehaviorSignals
                  ? getExitSectionHint(periodStats.topExitSection)
                  : `${periodStats.behaviorReliableFromLabel} 데이터부터 표시`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">결제 CTA 클릭 위치</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {periodStats.topCtaSection?.label || "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {periodStats.topCtaSection
                  ? `${periodStats.topCtaSection.count}세션 · ${periodStats.topCtaSection.range}`
                  : `${periodStats.behaviorReliableFromLabel} 데이터부터 표시`}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">이탈 위치 TOP 3</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {periodStats.hasReliableBehaviorSignals && periodStats.topExitSections.length ? (
                periodStats.topExitSections.map((section, index) => (
                  <div
                    key={section.raw}
                    className="rounded-lg border bg-background px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {index + 1}. {getExitSectionLabel(section)}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          본 구간: {section.range}
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          확인: {section.check}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-foreground">
                        {section.count}세션
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  이전 이탈 위치 데이터는 숨겼습니다. {periodStats.behaviorReliableFromLabel}{" "}
                  새 세션부터 표시됩니다.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">결제 클릭 위치 TOP 3</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {periodStats.topCtaSections.length ? (
                periodStats.topCtaSections.map((section, index) => (
                  <div
                    key={section.raw}
                    className="rounded-lg border bg-background px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {index + 1}. {section.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          클릭 구간: {section.range}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-foreground">
                        {section.count}세션
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  이전 클릭 위치 데이터는 숨겼습니다. {periodStats.behaviorReliableFromLabel}{" "}
                  새 세션부터 표시됩니다.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">보조 정보</h2>
          <p className="text-xs text-muted-foreground">
            메인 판단은 위 퍼널로 하고, 아래는 참고용으로 봅니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {periodConfig.label} 신규 가입
              </CardTitle>
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
              <div className="text-2xl font-bold text-foreground">
                {periodStats.paymentPending}
              </div>
              <p className="text-xs text-muted-foreground">
                결제창 진입 후 아직 완료 안 된 건
              </p>
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
                <p className="text-xs text-muted-foreground">
                  아직 유입 데이터가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
