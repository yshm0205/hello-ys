import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getInternalAdminUsers } from "@/lib/admin/internal-users";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SEOUL_TIME_ZONE = "Asia/Seoul";
const SALES_STATUSES = ["DONE", "PARTIAL_CANCELLED"] as const;

type SessionRow = {
  id: string;
  session_key: string;
  first_seen_at: string;
  last_seen_at: string;
  duration_seconds: number | null;
  max_scroll_percent: number | null;
  cta_clicks: number | null;
  last_visible_section: string | null;
  last_clicked_cta_section: string | null;
  referrer: string | null;
  device_type: string | null;
};

type PaymentRow = {
  session_key: string | null;
  status: string;
  amount: number | null;
  metadata: { provider?: string } | null;
  created_at: string;
};

function formatKstTime(isoString: string) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}초`;
  return `${m}분 ${s}초`;
}

function summarizeReferrer(referrer: string | null) {
  if (!referrer) return "direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return referrer.slice(0, 24);
  }
}

type StageId = "landing-only" | "cta-no-payment" | "checkout-pending" | "completed" | "other";

const STAGE_LABELS: Record<StageId, { label: string; color: string }> = {
  "landing-only": { label: "① 랜딩에서 끝", color: "text-orange-700" },
  "cta-no-payment": { label: "② CTA 후 결제 미시도", color: "text-amber-700" },
  "checkout-pending": { label: "③ 결제 미완료", color: "text-rose-700" },
  completed: { label: "✓ 결제 완료", color: "text-emerald-700" },
  other: { label: "결제 기타", color: "text-zinc-500" },
};

function classifySession(
  session: SessionRow,
  payment: PaymentRow | undefined,
): { stage: StageId; label: string; color: string } {
  const ctaClicks = session.cta_clicks || 0;

  if (payment) {
    if ((SALES_STATUSES as readonly string[]).includes(payment.status)) {
      return { stage: "completed", ...STAGE_LABELS.completed };
    }
    if (payment.status === "PENDING") {
      return { stage: "checkout-pending", ...STAGE_LABELS["checkout-pending"] };
    }
    return {
      stage: "other",
      label: `결제 ${payment.status}`,
      color: STAGE_LABELS.other.color,
    };
  }

  if (ctaClicks > 0) {
    return { stage: "cta-no-payment", ...STAGE_LABELS["cta-no-payment"] };
  }

  return { stage: "landing-only", ...STAGE_LABELS["landing-only"] };
}

async function getRecentSessions(limit = 100) {
  const supabase = createAdminClient();
  const internalAdmins = await getInternalAdminUsers();
  const internalIds = new Set(internalAdmins.map((u) => u.id));

  const { data: sessions, error } = await supabase
    .from("marketing_sessions")
    .select(
      "id, session_key, first_seen_at, last_seen_at, duration_seconds, max_scroll_percent, cta_clicks, last_visible_section, last_clicked_cta_section, referrer, device_type",
    )
    .order("first_seen_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { sessions: [] as SessionRow[], paymentMap: new Map<string, PaymentRow>() };
  }

  const sessionRows = (sessions || []) as SessionRow[];
  const sessionKeys = sessionRows.map((s) => s.session_key);

  let paymentMap = new Map<string, PaymentRow>();

  if (sessionKeys.length) {
    const { data: payments } = await supabase
      .from("toss_payments")
      .select("session_key, status, amount, metadata, created_at, user_id")
      .in("session_key", sessionKeys);

    const filtered = ((payments || []) as (PaymentRow & { user_id: string })[]).filter(
      (p) => !internalIds.has(p.user_id),
    );
    paymentMap = new Map(filtered.map((p) => [p.session_key as string, p]));
  }

  return { sessions: sessionRows, paymentMap };
}

function isValidStage(value: string | undefined): value is StageId {
  return (
    value === "landing-only" ||
    value === "cta-no-payment" ||
    value === "checkout-pending" ||
    value === "completed"
  );
}

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage: rawStage } = await searchParams;
  const activeStage: StageId | null = isValidStage(rawStage) ? rawStage : null;

  const { sessions: allSessions, paymentMap } = await getRecentSessions(200);

  const classifiedSessions = allSessions.map((session) => ({
    session,
    payment: paymentMap.get(session.session_key),
    classification: classifySession(session, paymentMap.get(session.session_key)),
  }));

  const stageCounts: Record<StageId, number> = {
    "landing-only": 0,
    "cta-no-payment": 0,
    "checkout-pending": 0,
    completed: 0,
    other: 0,
  };
  classifiedSessions.forEach((row) => {
    stageCounts[row.classification.stage] += 1;
  });

  const visibleSessions = activeStage
    ? classifiedSessions.filter((row) => row.classification.stage === activeStage)
    : classifiedSessions.slice(0, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">세션 탐색기</h1>
        <p className="text-sm text-muted-foreground mt-1">
          마케팅 세션 · 결제 상태와 함께 표시. 한 행 클릭 시 이벤트 trail 보기.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          ⚠️ 결제 매칭은 session_key 기반 — session_key 컬럼이 마이그레이션 적용된 이후 결제부터 정확
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Link
          href="/admin/sessions"
          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${
            activeStage === null
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          전체 ({classifiedSessions.length})
        </Link>
        {(["landing-only", "cta-no-payment", "checkout-pending", "completed"] as StageId[]).map(
          (stage) => {
            const meta = STAGE_LABELS[stage];
            const isActive = activeStage === stage;
            return (
              <Link
                key={stage}
                href={`/admin/sessions?stage=${stage}`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : `bg-background ${meta.color} border-border hover:bg-muted`
                }`}
              >
                {meta.label} ({stageCounts[stage]})
              </Link>
            );
          },
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {activeStage
              ? `${STAGE_LABELS[activeStage].label} · ${visibleSessions.length}건`
              : `전체 ${visibleSessions.length}개 세션 (최근 100개)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2">진입</th>
                  <th className="text-left font-medium px-2 py-2">단계</th>
                  <th className="text-left font-medium px-2 py-2">유입</th>
                  <th className="text-left font-medium px-2 py-2">디바이스</th>
                  <th className="text-right font-medium px-2 py-2">체류</th>
                  <th className="text-right font-medium px-2 py-2">스크롤</th>
                  <th className="text-right font-medium px-2 py-2">CTA</th>
                  <th className="text-left font-medium px-2 py-2">마지막 본 위치</th>
                  <th className="text-right font-medium px-4 py-2">trail</th>
                </tr>
              </thead>
              <tbody>
                {visibleSessions.map(({ session, classification }) => (
                  <tr
                    key={session.id}
                    className="border-b border-border/40 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2 text-xs whitespace-nowrap">
                      {formatKstTime(session.first_seen_at)}
                    </td>
                    <td className={`px-2 py-2 text-xs whitespace-nowrap ${classification.color}`}>
                      {classification.label}
                    </td>
                    <td className="px-2 py-2 text-xs whitespace-nowrap text-muted-foreground">
                      {summarizeReferrer(session.referrer)}
                    </td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">
                      {session.device_type || "-"}
                    </td>
                    <td className="px-2 py-2 text-xs text-right whitespace-nowrap">
                      {formatDuration(session.duration_seconds)}
                    </td>
                    <td className="px-2 py-2 text-xs text-right">
                      {session.max_scroll_percent ?? 0}%
                    </td>
                    <td className="px-2 py-2 text-xs text-right">
                      {session.cta_clicks ?? 0}
                    </td>
                    <td className="px-2 py-2 text-xs text-muted-foreground max-w-[180px] truncate">
                      {session.last_visible_section || "-"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/admin/sessions/${session.session_key}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        보기 →
                      </Link>
                    </td>
                  </tr>
                ))}
                {!visibleSessions.length && (
                  <tr>
                    <td colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                      {activeStage ? "이 단계의 세션이 없습니다." : "아직 세션이 없습니다."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
