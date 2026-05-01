import { ChevronLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SEOUL_TIME_ZONE = "Asia/Seoul";

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
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  pageviews: number | null;
};

type EventRow = {
  id: string;
  event_type: string;
  page_path: string | null;
  section: string | null;
  scroll_percent: number | null;
  duration_seconds: number | null;
  cta_target: string | null;
  cta_id: string | null;
  cta_label: string | null;
  cta_section: string | null;
  created_at: string;
};

type PaymentRow = {
  order_id: string;
  status: string;
  amount: number | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function formatKst(isoString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(isoString));
}

function eventTypeLabel(eventType: string) {
  switch (eventType) {
    case "page_view":
      return { label: "페이지 진입", color: "bg-blue-500/15 text-blue-300" };
    case "cta_click":
      return { label: "CTA 클릭", color: "bg-violet-500/20 text-violet-300" };
    case "heartbeat":
      return { label: "체류", color: "bg-zinc-500/15 text-zinc-400" };
    default:
      return { label: eventType, color: "bg-zinc-500/15 text-zinc-400" };
  }
}

async function getSessionDetail(sessionKey: string) {
  const supabase = createAdminClient();

  const [{ data: session }, { data: events, error: eventsError }, { data: payments }] =
    await Promise.all([
      supabase
        .from("marketing_sessions")
        .select(
          "id, session_key, first_seen_at, last_seen_at, duration_seconds, max_scroll_percent, cta_clicks, last_visible_section, last_clicked_cta_section, referrer, device_type, utm_source, utm_medium, utm_campaign, pageviews",
        )
        .eq("session_key", sessionKey)
        .maybeSingle(),
      supabase
        .from("marketing_session_events")
        .select(
          "id, event_type, page_path, section, scroll_percent, duration_seconds, cta_target, cta_id, cta_label, cta_section, created_at",
        )
        .eq("session_key", sessionKey)
        .order("created_at", { ascending: true }),
      supabase
        .from("toss_payments")
        .select("order_id, status, amount, created_at, metadata")
        .eq("session_key", sessionKey)
        .order("created_at", { ascending: true }),
    ]);

  return {
    session: (session as SessionRow | null) || null,
    events: (events as EventRow[] | null) || [],
    eventsError,
    payments: (payments as PaymentRow[] | null) || [],
  };
}

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionKey: string }>;
}) {
  const { sessionKey } = await params;
  const { session, events, eventsError, payments } = await getSessionDetail(sessionKey);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/sessions"
          className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-3 w-3" />
          세션 리스트로
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-foreground break-all">
          세션 {sessionKey.slice(0, 8)}…
        </h1>
        <p className="text-xs text-muted-foreground mt-1">{sessionKey}</p>
      </div>

      {!session ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            해당 세션을 찾을 수 없습니다.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  진입
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm font-semibold">
                {formatKst(session.first_seen_at)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  체류
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm font-semibold">
                {Math.floor((session.duration_seconds ?? 0) / 60)}분{" "}
                {(session.duration_seconds ?? 0) % 60}초
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  최대 스크롤
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm font-semibold">
                {session.max_scroll_percent ?? 0}%
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  CTA 클릭
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm font-semibold">
                {session.cta_clicks ?? 0}회
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">유입 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-xs md:grid-cols-2">
              <div>
                <span className="text-muted-foreground">레퍼러: </span>
                <span className="break-all">{session.referrer || "direct"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">디바이스: </span>
                <span>{session.device_type || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">UTM source: </span>
                <span>{session.utm_source || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">UTM campaign: </span>
                <span>{session.utm_campaign || "-"}</span>
              </div>
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  결제 ({payments.length}건)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.order_id}
                    className="rounded-md border bg-background px-3 py-2 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{p.order_id}</p>
                      <p className="text-muted-foreground">{formatKst(p.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {(p.amount || 0).toLocaleString()}원
                      </p>
                      <p className="text-muted-foreground">{p.status}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                이벤트 trail ({events.length}건)
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                heartbeat 제외 · 시간 순
              </p>
            </CardHeader>
            <CardContent>
              {eventsError ? (
                <p className="text-xs text-muted-foreground py-4">
                  events 테이블이 아직 적용되지 않았거나 조회 실패. 마이그레이션 적용 필요.
                </p>
              ) : events.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">
                  이 세션의 이벤트가 없습니다. 마이그레이션 적용 후 새 세션부터 적재됩니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {events.map((event, idx) => {
                    const meta = eventTypeLabel(event.event_type);
                    return (
                      <div
                        key={event.id}
                        className="rounded-md border bg-background px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-muted-foreground tabular-nums">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-muted-foreground">
                            {formatKst(event.created_at)}
                          </span>
                          {event.duration_seconds != null && (
                            <span className="text-muted-foreground">
                              · {event.duration_seconds}s
                            </span>
                          )}
                          {event.scroll_percent != null && (
                            <span className="text-muted-foreground">
                              · 스크롤 {event.scroll_percent}%
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground space-y-0.5">
                          {event.page_path && <p>경로: {event.page_path}</p>}
                          {event.section && <p>본 섹션: {event.section}</p>}
                          {event.event_type === "cta_click" && (
                            <>
                              {event.cta_target && (
                                <p>CTA → {event.cta_target}</p>
                              )}
                              {event.cta_section && (
                                <p>CTA 위치: {event.cta_section}</p>
                              )}
                              {event.cta_label && (
                                <p>라벨: &quot;{event.cta_label}&quot;</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
