import { NextRequest, NextResponse } from "next/server";

import { getInternalAdminUsers } from "@/lib/admin/internal-users";
import { createAdminClient } from "@/utils/supabase/admin";

const SALES_STATUSES = ["DONE", "PARTIAL_CANCELLED"] as const;
const SEOUL_TIME_ZONE = "Asia/Seoul";
const LAUNCH_OPEN_AT_KST = "2026-04-24T17:00:00+09:00";

type SalesStatus = (typeof SALES_STATUSES)[number];

interface PaymentRow {
  id: string;
  amount: number;
  created_at: string;
  user_id: string;
  status: string;
  metadata: Record<string, unknown> | null;
}

interface MarketingSessionRow {
  cta_clicks: number | null;
  referrer: string | null;
  first_seen_at: string;
}

interface FeedbackRow {
  id: string;
  created_at: string;
}

interface UserRow {
  id: string;
  created_at: string;
}

function verifyMetricsToken(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = process.env.METRICS_API_TOKEN;

  if (!token) {
    console.warn("[Metrics] METRICS_API_TOKEN not set - rejecting request");
    return false;
  }

  return authHeader === `Bearer ${token}`;
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
    year: parts.find((p) => p.type === "year")?.value ?? "1970",
    month: parts.find((p) => p.type === "month")?.value ?? "01",
    day: parts.find((p) => p.type === "day")?.value ?? "01",
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
    label: `${start.toLocaleDateString("ko-KR", { timeZone: SEOUL_TIME_ZONE })}`,
  };
}

function getKstBackRange(days: number) {
  const { year, month, day } = getKstDateParts();
  const end = new Date(`${year}-${month}-${day}T00:00:00+09:00`);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function getLaunchOpenAtIso() {
  return new Date(LAUNCH_OPEN_AT_KST).toISOString();
}

function getNumericMetadata(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getNetRevenue(payment: Pick<PaymentRow, "amount" | "status" | "metadata">) {
  if (payment.status === "DONE") return payment.amount;
  if (payment.status === "PARTIAL_CANCELLED") {
    const cancelled = getNumericMetadata(payment.metadata, "cancelledAmount");
    return Math.max(0, payment.amount - cancelled);
  }
  return 0;
}

function normalizeReferrer(raw: string | null): string {
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

  if (hostname.includes("instagram")) return "Instagram";
  if (hostname.includes("youtube") || hostname.includes("youtu.be")) return "YouTube";
  if (hostname.includes("google")) return "Google";
  if (hostname.includes("naver")) return "Naver";
  if (hostname.includes("kakao")) return "Kakao";
  if (hostname.includes("tiktok")) return "TikTok";
  if (hostname.includes("twitter") || hostname.includes("x.com")) return "X/Twitter";
  if (hostname.includes("facebook")) return "Facebook";
  if (hostname.includes("threads")) return "Threads";
  if (hostname.includes("flowspot.kr")) return "internal";
  return hostname || "direct";
}

function countReferrerTop(rows: MarketingSessionRow[], topN = 3) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = normalizeReferrer(row.referrer);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([source, count]) => ({ source, count }));
}

function summarizePeriod(args: {
  payments: PaymentRow[];
  sessions: MarketingSessionRow[];
  inquiries: FeedbackRow[];
  includeSalesAmount?: boolean;
}) {
  const { payments, sessions, inquiries, includeSalesAmount = false } = args;

  const attempts = payments.length;
  const completedRows = payments.filter((p) =>
    (SALES_STATUSES as readonly string[]).includes(p.status),
  );
  const completed = completedRows.length;
  const failed = Math.max(0, attempts - completed);

  const canceledRows = payments.filter(
    (p) => p.status === "CANCELED" || p.status === "CANCELLED",
  );
  const refunds = canceledRows.length;

  const landing = sessions.length;
  const ctaUnique = sessions.filter((s) => (s.cta_clicks || 0) > 0).length;
  const ctaRate = landing > 0 ? Math.round((ctaUnique / landing) * 1000) / 10 : 0;
  const referrerTop = countReferrerTop(sessions, 3);

  const salesAmount = includeSalesAmount
    ? completedRows.reduce((sum, p) => sum + getNetRevenue(p), 0)
    : undefined;

  return {
    landing,
    cta_unique: ctaUnique,
    cta_rate_percent: ctaRate,
    referrer_top: referrerTop,
    payment_attempts: attempts,
    payment_completed: completed,
    payment_failed: failed,
    ...(includeSalesAmount ? { sales_amount_krw: salesAmount } : {}),
    inquiries: inquiries.length,
    refunds,
  };
}

export async function GET(request: NextRequest) {
  if (!verifyMetricsToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const internalAdmins = await getInternalAdminUsers();
    const internalIds = new Set(internalAdmins.map((u) => u.id));

    const yesterday = getKstDayRange(-1);
    const last7 = getKstBackRange(7);
    const last30 = getKstBackRange(30);
    const launchOpenAtIso = getLaunchOpenAtIso();

    const paymentSelect = "id, amount, created_at, user_id, status, metadata";

    const [
      { data: yPayments },
      { data: ySessions },
      { data: yInquiries },
      { data: w7Payments },
      { data: w7Sessions },
      { data: w7Inquiries },
      { data: m30Payments },
      { data: m30Sessions },
      { data: m30Inquiries },
      { data: launchPaymentsRaw },
      { data: launchSessionsRaw },
      { data: launchUsersRaw },
    ] = await Promise.all([
      admin
        .from("toss_payments")
        .select(paymentSelect)
        .gte("created_at", yesterday.startIso)
        .lt("created_at", yesterday.endIso),
      admin
        .from("marketing_sessions")
        .select("cta_clicks, referrer, first_seen_at")
        .gte("first_seen_at", yesterday.startIso)
        .lt("first_seen_at", yesterday.endIso),
      admin
        .from("feedback_requests")
        .select("id, created_at")
        .gte("created_at", yesterday.startIso)
        .lt("created_at", yesterday.endIso),
      admin
        .from("toss_payments")
        .select(paymentSelect)
        .gte("created_at", last7.startIso)
        .lt("created_at", last7.endIso),
      admin
        .from("marketing_sessions")
        .select("cta_clicks, referrer, first_seen_at")
        .gte("first_seen_at", last7.startIso)
        .lt("first_seen_at", last7.endIso),
      admin
        .from("feedback_requests")
        .select("id, created_at")
        .gte("created_at", last7.startIso)
        .lt("created_at", last7.endIso),
      admin
        .from("toss_payments")
        .select(paymentSelect)
        .gte("created_at", last30.startIso)
        .lt("created_at", last30.endIso),
      admin
        .from("marketing_sessions")
        .select("cta_clicks, referrer, first_seen_at")
        .gte("first_seen_at", last30.startIso)
        .lt("first_seen_at", last30.endIso),
      admin
        .from("feedback_requests")
        .select("id, created_at")
        .gte("created_at", last30.startIso)
        .lt("created_at", last30.endIso),
      admin
        .from("toss_payments")
        .select(paymentSelect)
        .gte("created_at", launchOpenAtIso),
      admin
        .from("marketing_sessions")
        .select("cta_clicks, referrer, first_seen_at")
        .gte("first_seen_at", launchOpenAtIso),
      admin.from("users").select("id, created_at").gte("created_at", launchOpenAtIso),
    ]);

    const filterPayments = (rows: PaymentRow[] | null) =>
      ((rows || []) as PaymentRow[]).filter((p) => !internalIds.has(p.user_id));

    const yesterdayData = summarizePeriod({
      payments: filterPayments(yPayments as PaymentRow[] | null),
      sessions: (ySessions || []) as MarketingSessionRow[],
      inquiries: (yInquiries || []) as FeedbackRow[],
    });

    const last7Data = summarizePeriod({
      payments: filterPayments(w7Payments as PaymentRow[] | null),
      sessions: (w7Sessions || []) as MarketingSessionRow[],
      inquiries: (w7Inquiries || []) as FeedbackRow[],
    });

    const last30Data = summarizePeriod({
      payments: filterPayments(m30Payments as PaymentRow[] | null),
      sessions: (m30Sessions || []) as MarketingSessionRow[],
      inquiries: (m30Inquiries || []) as FeedbackRow[],
      includeSalesAmount: true,
    });

    const launchPayments = filterPayments(launchPaymentsRaw as PaymentRow[] | null).filter(
      (payment) => payment.metadata?.provider === "tosspay-direct",
    );
    const launchSessions = (launchSessionsRaw || []) as MarketingSessionRow[];
    const launchUsers = ((launchUsersRaw || []) as UserRow[]).filter(
      (user) => !internalIds.has(user.id),
    );
    const launchCompletedRows = launchPayments.filter((payment) =>
      (SALES_STATUSES as readonly string[]).includes(payment.status),
    );
    const launchPendingRows = launchPayments.filter((payment) => payment.status === "PENDING");

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      timezone: SEOUL_TIME_ZONE,
      periods: {
        yesterday: {
          label: yesterday.label,
          start: yesterday.startIso,
          end: yesterday.endIso,
          ...yesterdayData,
        },
        last_7d: {
          start: last7.startIso,
          end: last7.endIso,
          ...last7Data,
        },
        last_30d: {
          start: last30.startIso,
          end: last30.endIso,
          ...last30Data,
        },
      },
      launch_since_open: {
        start: launchOpenAtIso,
        landing: launchSessions.length,
        cta_unique: launchSessions.filter((session) => (session.cta_clicks || 0) > 0).length,
        cta_clicks: launchSessions.reduce((sum, session) => sum + (session.cta_clicks || 0), 0),
        signups: launchUsers.length,
        payment_attempts: launchPayments.length,
        payment_pending: launchPendingRows.length,
        payment_completed: launchCompletedRows.length,
        sales_amount_krw: launchCompletedRows.reduce(
          (sum, payment) => sum + getNetRevenue(payment),
          0,
        ),
        referrer_top: countReferrerTop(launchSessions, 4),
        payment_provider: "tosspay-direct",
      },
      notes: {
        internal_emails_excluded: internalAdmins.length,
        sales_filter: "DONE + PARTIAL_CANCELLED",
        refunds_filter: "status CANCELED (created_at in period)",
        launch_basis: "2026-04-24 17:00 KST open, TossPay Direct only",
      },
    });
  } catch (error) {
    console.error("[Metrics] daily report failed:", error);
    return NextResponse.json({ error: "metrics fetch failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
