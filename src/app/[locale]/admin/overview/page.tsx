import {
  Clock3,
  Coins,
  Eye,
  MousePointerClick,
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
const READ_DEPTH_TRACKING_FROM_KST = "2026-04-28T22:22:00+09:00";
const READ_DEPTH_TRACKING_FROM_LABEL = "4/28 22:22 이후";
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
  reviews: {
    label: "구매자 리뷰",
    range: "실제 구매자의 리뷰 섹션부터 FAQ 전까지",
    check: "후기가 신뢰를 만들고 있는지, 후기 수가 부족해 보이지 않는지",
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
const LANDING_SECTION_ORDER = [
  "landing-hero",
  "earlybird",
  "loop-pain",
  "pain",
  "offer",
  "compare",
  "how-it-works",
  "reviews",
  "faq",
  "floating-cta-mobile",
  "floating-cta-desktop",
] as const;
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

function isReadDepthSession(session: MarketingSessionRow) {
  if (!session.first_seen_at) return false;
  return (
    new Date(session.first_seen_at).getTime() >=
    new Date(READ_DEPTH_TRACKING_FROM_KST).getTime()
  );
}

function isQuickBounceSession(session: MarketingSessionRow) {
  return (session.duration_seconds || 0) < 10 || (session.max_scroll_percent || 0) < 20;
}

function isFullReadSession(session: MarketingSessionRow) {
  if (isQuickBounceSession(session)) return false;
  const lastSection = session.last_visible_section;
  return (
    (session.max_scroll_percent || 0) >= 85 ||
    lastSection === "faq" ||
    lastSection === "cta"
  );
}

function isMiddleReadSession(session: MarketingSessionRow) {
  // quick도 아니고 full도 아닌 나머지 — 3개 카테고리가 합 100%
  return !isQuickBounceSession(session) && !isFullReadSession(session);
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
  const readDepthSessions = periodSessions.filter(isReadDepthSession);

  const averageDurationSeconds = readDepthSessions.length
    ? Math.round(
        readDepthSessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) /
          readDepthSessions.length,
      )
    : 0;

  const averageMaxScrollPercent = readDepthSessions.length
    ? Math.round(
        readDepthSessions.reduce((sum, session) => sum + (session.max_scroll_percent || 0), 0) /
          readDepthSessions.length,
      )
    : 0;

  const hasBehaviorSignals = readDepthSessions.some(
    (session) =>
      (session.max_scroll_percent || 0) > 0 ||
      !!session.last_visible_section ||
      !!session.last_clicked_cta_section,
  );
  const reliableBehaviorSessions = periodSessions.filter(isReliableBehaviorSession);
  const reliableCtaSessions = reliableBehaviorSessions.filter(
    (session) => (session.cta_clicks || 0) > 0,
  );
  const reliableExitSessions = reliableBehaviorSessions.filter(
    (session) => (session.cta_clicks || 0) === 0,
  );
  const hasReliableBehaviorSignals = reliableBehaviorSessions.some(
    (session) => !!session.last_visible_section || !!session.last_clicked_cta_section,
  );
  const hasReliableExitSignals = reliableExitSessions.some(
    (session) => !!session.last_visible_section,
  );
  const quickBounceSessions = readDepthSessions.filter(isQuickBounceSession);
  const middleReadSessions = readDepthSessions.filter(isMiddleReadSession);
  const fullReadSessions = readDepthSessions.filter(isFullReadSession);
  // "읽고 클릭" = 바로 나감 아닌 사람 중 CTA 클릭한 사람 (= middle + full 중 클릭)
  const readAndClickSessions = readDepthSessions.filter(
    (session) => !isQuickBounceSession(session) && (session.cta_clicks || 0) > 0,
  );
  const stayingSessionCount = middleReadSessions.length + fullReadSessions.length;

  // 세션 단위 4분할 — 한 사람의 여정 중 어디서 떠났는가
  // 주의: paymentAttempts는 결제건 단위, ctaUnique/landingSessions는 세션 단위라 정확 매칭은 2단계(session_key 보강)에서 가능
  const droppedAtLanding = Math.max(0, periodSessions.length - ctaUnique);
  const droppedAfterCta = Math.max(0, ctaUnique - periodPayments.length);
  const droppedAtCheckout = pendingPayments.length;
  const completed = completedPayments.length;

  return {
    openedAtLabel: getLaunchOpenAtLabel(),
    readDepthFromLabel: READ_DEPTH_TRACKING_FROM_LABEL,
    readDepthSessionCount: readDepthSessions.length,
    behaviorReliableFromLabel: BEHAVIOR_TRACKING_RELIABLE_FROM_LABEL,
    reliableBehaviorSessionCount: reliableBehaviorSessions.length,
    reliableExitSessionCount: reliableExitSessions.length,
    reliableCtaSessionCount: reliableCtaSessions.length,
    quickBounceSessions: quickBounceSessions.length,
    middleReadSessions: middleReadSessions.length,
    fullReadSessions: fullReadSessions.length,
    readAndClickSessions: readAndClickSessions.length,
    stayingSessionCount,
    landingSessions: periodSessions.length,
    ctaUnique,
    ctaClicks: periodSessions.reduce((sum, session) => sum + (session.cta_clicks || 0), 0),
    signups: periodUsers.length,
    paymentAttempts: periodPayments.length,
    paymentPending: pendingPayments.length,
    paymentCompleted: completedPayments.length,
    droppedAtLanding,
    droppedAfterCta,
    droppedAtCheckout,
    completed,
    revenue: completedPayments.reduce((sum, payment) => sum + getNetRevenue(payment), 0),
    topReferrers: summarizeReferrers(periodSessions, 3),
    averageDurationSeconds,
    averageMaxScrollPercent,
    hasBehaviorSignals,
    hasReliableBehaviorSignals,
    hasReliableExitSignals,
    topExitSection: summarizeTopSection(
      reliableExitSessions,
      (session) => session.last_visible_section,
    ),
    topExitSections: summarizeTopSections(
      reliableExitSessions,
      (session) => session.last_visible_section,
      3,
    ),
    allExitSections: summarizeTopSections(
      reliableExitSessions,
      (session) => session.last_visible_section,
      20,
    ),
    topCtaViewSection: summarizeTopSection(
      reliableCtaSessions,
      (session) => session.last_visible_section,
    ),
    topCtaViewSections: summarizeTopSections(
      reliableCtaSessions,
      (session) => session.last_visible_section,
      3,
    ),
    allCtaViewSections: summarizeTopSections(
      reliableCtaSessions,
      (session) => session.last_visible_section,
      20,
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
    allCtaSections: summarizeTopSections(
      reliableCtaSessions,
      (session) => session.last_clicked_cta_section,
      20,
    ),
  };
}

type PeriodStats = Awaited<ReturnType<typeof getPeriodStats>>;
type InsightTone = "good" | "warning" | "danger" | "neutral";

function getToneClassName(tone: InsightTone) {
  if (tone === "good") return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-950";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-slate-200 bg-slate-50 text-slate-950";
}

function getMutedToneClassName(tone: InsightTone) {
  if (tone === "good") return "text-emerald-700/80";
  if (tone === "danger") return "text-rose-700/80";
  if (tone === "warning") return "text-amber-700/80";
  return "text-slate-600";
}

function getPrimaryBottleneckInsight(stats: PeriodStats) {
  const ctaRate = getRate(stats.ctaUnique, stats.landingSessions);
  const ctaToPaymentRate = getRate(stats.paymentAttempts, stats.ctaUnique);
  const paymentDoneRate = getRate(stats.paymentCompleted, stats.paymentAttempts);
  const quickBounceRate = getRate(stats.quickBounceSessions, stats.readDepthSessionCount);

  if (stats.landingSessions < 10) {
    return {
      title: "판단 보류",
      value: "표본 부족",
      tone: "neutral" as const,
      body: `현재 ${stats.landingSessions}세션이라 결론보다 추적 누적이 먼저입니다.`,
      action: "오늘은 유입 수와 결제 완료 여부만 확인하세요.",
    };
  }

  if (stats.readDepthSessionCount >= 5 && quickBounceRate >= 45) {
    return {
      title: "가장 큰 병목",
      value: "첫 화면 이탈",
      tone: "danger" as const,
      body: `바로 나감이 ${quickBounceRate}%입니다. 첫 화면에서 더 읽을 이유가 약할 수 있습니다.`,
      action: "헤드라인, 첫 혜택 문구, 첫 CTA 주변 신뢰요소를 먼저 보세요.",
      href: "/admin/sessions?stage=landing-only",
    };
  }

  if (ctaRate < 8) {
    return {
      title: "가장 큰 병목",
      value: "CTA 클릭 부족",
      tone: "danger" as const,
      body: `랜딩 방문 대비 CTA가 ${ctaRate}%입니다. 읽어도 신청 행동으로 잘 안 넘어갑니다.`,
      action: "가격/혜택이 처음 30초 안에 이해되는지와 CTA 문구를 확인하세요.",
      href: "/admin/sessions?stage=landing-only",
    };
  }

  if (stats.ctaUnique >= 3 && ctaToPaymentRate < 60) {
    return {
      title: "가장 큰 병목",
      value: "CTA 후 결제 미시도",
      tone: "warning" as const,
      body: `CTA 클릭 후 결제 시도 전환이 ${ctaToPaymentRate}%입니다.`,
      action: "로그인/회원가입 화면 문구와 결제창 이동 흐름을 우선 확인하세요.",
      href: "/admin/sessions?stage=cta-no-payment",
    };
  }

  if (stats.paymentAttempts >= 3 && paymentDoneRate < 50) {
    return {
      title: "가장 큰 병목",
      value: "결제창 미완료",
      tone: "warning" as const,
      body: `결제 시도 대비 완료가 ${paymentDoneRate}%입니다.`,
      action: "카드/계좌이체 안내, 가격 확신, 쿠폰 적용 여부를 확인하세요.",
      href: "/admin/sessions?stage=checkout-pending",
    };
  }

  return {
    title: "현재 판단",
    value: stats.paymentCompleted > 0 ? "구매 흐름 작동" : "관망 구간",
    tone: stats.paymentCompleted > 0 ? ("good" as const) : ("neutral" as const),
    body:
      stats.paymentCompleted > 0
        ? `결제 완료 ${stats.paymentCompleted}건이 있어 흐름 자체는 작동 중입니다.`
        : "큰 오류보다는 유입과 클릭 표본을 더 쌓아야 합니다.",
    action: "가장 많이 이탈한 구간과 클릭이 나온 구간을 같이 비교하세요.",
  };
}

function getPrioritySectionInsight(stats: PeriodStats) {
  const section = stats.topExitSection;

  if (section && stats.reliableExitSessionCount > 0) {
    return {
      title: "우선 확인 구간",
      value: getExitSectionLabel(section),
      tone: "warning" as const,
      body: `${section.count}세션이 CTA 없이 이 구간에서 끝났습니다.`,
      action: section.check,
      href: "/admin/sessions?stage=landing-only",
    };
  }

  if (stats.topCtaSection && stats.reliableCtaSessionCount > 0) {
    return {
      title: "클릭 발생 구간",
      value: stats.topCtaSection.label,
      tone: "good" as const,
      body: `${stats.topCtaSection.count}세션이 이 구간 CTA를 눌렀습니다.`,
      action: "클릭이 나온 구간의 문구와 구조를 다른 구간에도 재활용할 수 있는지 보세요.",
    };
  }

  return {
    title: "우선 확인 구간",
    value: "위치 데이터 대기",
    tone: "neutral" as const,
    body: `${stats.behaviorReliableFromLabel} 이후 세션부터 정확히 표시됩니다.`,
    action: "오늘은 랜딩 방문, CTA, 결제 시도만 먼저 보세요.",
  };
}

function getTodayActionInsight(stats: PeriodStats) {
  const readAndClickRate = getRate(stats.readAndClickSessions, stats.readDepthSessionCount);
  const fullReadRate = getRate(stats.fullReadSessions, stats.readDepthSessionCount);

  if (stats.readDepthSessionCount >= 5 && fullReadRate >= 40 && readAndClickRate < 15) {
    return {
      title: "오늘 할 일",
      value: "읽었는데 안 누름",
      tone: "warning" as const,
      body: `끝까지 본 비율은 ${fullReadRate}%인데 읽고 클릭은 ${readAndClickRate}%입니다.`,
      action: "후반부 가격 확신, 보너스 가치, 마지막 CTA 문구를 보강할지 검토하세요.",
    };
  }

  if (stats.droppedAfterCta > stats.droppedAtLanding && stats.ctaUnique >= 3) {
    return {
      title: "오늘 할 일",
      value: "결제 진입 확인",
      tone: "warning" as const,
      body: `CTA 후 결제 미시도가 ${stats.droppedAfterCta}명입니다.`,
      action: "회원가입/로그인 뒤 결제창으로 제대로 복귀하는지 모바일 기준으로 다시 보세요.",
      href: "/admin/sessions?stage=cta-no-payment",
    };
  }

  return {
    title: "오늘 할 일",
    value: "구간별 비교",
    tone: "neutral" as const,
    body: "하나만 고치기보다 이탈 구간과 클릭 구간의 차이를 먼저 보세요.",
    action: "아래 구간별 진단표에서 이탈은 높은데 클릭은 낮은 구간을 우선 확인하세요.",
  };
}

function getInsightCards(stats: PeriodStats) {
  return [
    getPrimaryBottleneckInsight(stats),
    getPrioritySectionInsight(stats),
    getTodayActionInsight(stats),
  ];
}

function getSectionCountMap(sections: LandingSectionSummary[]) {
  return new Map(sections.map((section) => [section.raw, section.count]));
}

function getSectionDiagnosis(exitCount: number, readClickCount: number) {
  if (exitCount > 0 && readClickCount === 0) {
    return "읽고 멈춘 구간입니다. 문구가 길거나 다음 행동 이유가 약한지 확인";
  }

  if (exitCount > readClickCount) {
    return "본 뒤 나간 사람이 신청한 사람보다 많습니다. 혜택·가격·불안 해소 문구 확인";
  }

  if (readClickCount > 0) {
    return "이 구간을 본 뒤 신청이 나온 구간입니다. 설득 문구를 다른 구간에 재활용 가능";
  }

  return "아직 판단할 표본이 적습니다.";
}

function getLandingSectionDiagnostics(stats: PeriodStats) {
  const exitCounts = getSectionCountMap(stats.allExitSections);
  const readClickCounts = getSectionCountMap(stats.allCtaViewSections);

  return LANDING_SECTION_ORDER.map((raw) => {
    const info = getSectionInfo(raw);
    const exitCount = exitCounts.get(raw) || 0;
    const readClickCount = readClickCounts.get(raw) || 0;

    return {
      raw,
      ...info,
      exitCount,
      readClickCount,
      exitShare: getRate(exitCount, stats.reliableExitSessionCount),
      readClickShare: getRate(readClickCount, stats.reliableCtaSessionCount),
      diagnosis: getSectionDiagnosis(exitCount, readClickCount),
    };
  });
}

const OVERVIEW_READ_GUIDE = [
  {
    title: "1. 먼저 병목",
    body: "상단 카드에서 빨간색·노란색만 보면 됩니다. 오늘 어디가 막혔는지 요약입니다.",
  },
  {
    title: "2. 다음 퍼널",
    body: "방문 → 신청 버튼 → 결제 시도 → 결제 완료 중 어느 단계에서 많이 빠지는지 봅니다.",
  },
  {
    title: "3. 마지막 구간표",
    body: "구간별로 여기서 나감과 신청 직전 본 구간을 비교합니다. 이탈만 높은 줄부터 확인하세요.",
  },
] as const;

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
  const insightCards = getInsightCards(periodStats);
  const sectionDiagnostics = getLandingSectionDiagnostics(periodStats);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          랜딩 문제 진단
        </h1>
        <p className="text-sm text-muted-foreground">
          숫자만 보는 화면이 아니라, 어느 구간을 고쳐야 하는지 판단하는 화면입니다.
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

      <Card className="border-slate-200 bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">이 화면은 이렇게 보면 됩니다</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {OVERVIEW_READ_GUIDE.map((item) => (
              <div key={item.title} className="rounded-lg bg-white px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">먼저 이것만 보세요</h2>
          <p className="text-xs text-muted-foreground">
            빨간색은 바로 의심할 문제, 노란색은 오늘 확인할 후보입니다.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {insightCards.map((insight) => (
            <Card
              key={`${insight.title}-${insight.value}`}
              className={getToneClassName(insight.tone)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold">{insight.value}</div>
                <p className={`text-xs leading-5 ${getMutedToneClassName(insight.tone)}`}>
                  {insight.body}
                </p>
                <p className="text-xs font-semibold leading-5">해야 할 일: {insight.action}</p>
                {insight.href && (
                  <Link
                    href={insight.href}
                    className="inline-block text-xs font-semibold underline-offset-4 hover:underline"
                  >
                    관련 세션 보기 →
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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
            숫자 흐름
          </h2>
          <p className="text-xs text-muted-foreground">
            {marketingPeriod === "launch"
              ? `${periodStats.openedAtLabel} 오픈 이후`
              : periodConfig.caption}{" "}
            · TossPay Direct · 내부 계정 제외
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">랜딩 들어온 세션</CardTitle>
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
              <CardTitle className="text-sm font-medium">신청 버튼 누른 세션</CardTitle>
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
              <CardTitle className="text-sm font-medium">실결제 매출</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(periodStats.revenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                결제 시도 {periodStats.paymentAttempts} · 완료 {periodStats.paymentCompleted}건
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">랜딩 어느 부분을 고칠지</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              실제 랜딩 순서대로 봅니다. 이탈과 신청 직전 본 구간만 비교하면 됩니다.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="border-b text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-medium">랜딩 구간</th>
                    <th className="py-2 pr-3 font-medium">실제 위치</th>
                    <th className="py-2 pr-3 font-medium">여기서 나감</th>
                    <th className="py-2 pr-3 font-medium">신청 직전 본 구간</th>
                    <th className="py-2 pr-3 font-medium">해석</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sectionDiagnostics.map((section) => (
                    <tr key={section.raw} className="align-top">
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-foreground">{section.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          확인: {section.check}
                        </p>
                      </td>
                      <td className="max-w-[280px] py-3 pr-3 text-xs leading-5 text-muted-foreground">
                        {section.range}
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-foreground">
                          {section.exitCount}세션
                        </p>
                        <p className="text-xs text-muted-foreground">
                          이탈 중 {section.exitShare}%
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-foreground">
                          {section.readClickCount}세션
                        </p>
                        <p className="text-xs text-muted-foreground">
                          신청 중 {section.readClickShare}%
                        </p>
                      </td>
                      <td className="max-w-[260px] py-3 pr-3 text-xs leading-5 text-muted-foreground">
                        {section.diagnosis}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">어디서 빠지는지</h2>
          <p className="text-xs text-muted-foreground">
            전환율과 단계별 이탈자 수를 함께 봅니다. (결제↔세션 정확 매칭은 session_key 연동 후)
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

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">
                ① 랜딩에서 끝
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {periodStats.droppedAtLanding}명
              </div>
              <p className="text-xs text-orange-700/80">
                CTA 미클릭 · 아래 이탈 위치 TOP 3에서 어디서 떠났나 확인
              </p>
              <Link
                href="/admin/sessions?stage=landing-only"
                className="mt-2 inline-block text-xs font-semibold text-orange-800 hover:underline"
              >
                이 {periodStats.droppedAtLanding}명 보기 →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">
                ② CTA 후 결제 미시도
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">
                {periodStats.droppedAfterCta}명
              </div>
              <p className="text-xs text-amber-700/80">
                CTA 클릭했지만 결제창에 안 옴 · 로그인/회원가입 단계 의심
              </p>
              <Link
                href="/admin/sessions?stage=cta-no-payment"
                className="mt-2 inline-block text-xs font-semibold text-amber-800 hover:underline"
              >
                이 {periodStats.droppedAfterCta}명 보기 →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-rose-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rose-800">
                ③ 결제 시도 미완료
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-900">
                {periodStats.droppedAtCheckout}건
              </div>
              <p className="text-xs text-rose-700/80">
                결제창 진입 후 PENDING · 카드 한도/이체 망설임 의심
              </p>
              <Link
                href="/admin/sessions?stage=checkout-pending"
                className="mt-2 inline-block text-xs font-semibold text-rose-800 hover:underline"
              >
                이 {periodStats.droppedAtCheckout}건 보기 →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">
                ✓ 결제 완료
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">
                {periodStats.completed}건
              </div>
              <p className="text-xs text-emerald-700/80">
                DONE / PARTIAL_CANCELLED 기준
              </p>
              <Link
                href="/admin/sessions?stage=completed"
                className="mt-2 inline-block text-xs font-semibold text-emerald-800 hover:underline"
              >
                이 {periodStats.completed}건 보기 →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">랜딩 행동 요약</h2>
          <p className="text-xs text-muted-foreground">
            소화율은 {periodStats.readDepthFromLabel}, 이탈 위치와 클릭 위치는{" "}
            {periodStats.behaviorReliableFromLabel} 새 데이터만 봅니다. 소화율 표본{" "}
            {periodStats.readDepthSessionCount}세션 · 위치 표본{" "}
            {periodStats.reliableBehaviorSessionCount}세션.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">바로 나감</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {getRate(periodStats.quickBounceSessions, periodStats.readDepthSessionCount)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {periodStats.quickBounceSessions}세션 · 10초 미만 또는 스크롤 20% 미만
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">중간까지 봄</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {getRate(periodStats.middleReadSessions, periodStats.readDepthSessionCount)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {periodStats.middleReadSessions}세션 · 스크롤 50% 이상
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">끝까지 봄</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {getRate(periodStats.fullReadSessions, periodStats.readDepthSessionCount)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {periodStats.fullReadSessions}세션 · 85% 이상 또는 FAQ/마지막 신청 도달
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">읽고 클릭</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {getRate(periodStats.readAndClickSessions, periodStats.readDepthSessionCount)}%
              </div>
              <p className="text-xs text-muted-foreground">
                전체 {periodStats.readDepthSessionCount}세션 중 {periodStats.readAndClickSessions}세션 ·
                머문 사람 ({periodStats.stayingSessionCount}명) 중 {getRate(periodStats.readAndClickSessions, periodStats.stayingSessionCount)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
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
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">이탈 위치 TOP 3</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                ① CTA 안 누르고 떠난 {periodStats.reliableExitSessionCount}세션 기준
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {periodStats.hasReliableExitSignals && periodStats.topExitSections.length ? (
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
                          확인: CTA를 누르지 않고 여기서 끝난 이유
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
              <p className="text-[11px] text-muted-foreground">
                ✓ CTA 누른 {periodStats.reliableCtaSessionCount}세션 기준
              </p>
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

        <div className="grid gap-4 md:grid-cols-2">
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
