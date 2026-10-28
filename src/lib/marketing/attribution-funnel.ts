import { paymentTime } from "./attribution-model";
import { attributionContext, UNKNOWN } from "./attribution-report";
import type { AttributionSources, ReportRange } from "./attribution-report";

const DAY_MS = 86400000;
const KST_MS = 9 * 3600000;

// 구매 화면의 기존 MarketingTracker 버튼 기록 (cta_click)
export const SELECT_CTA_IDS = ["checkout-select-purchase"] as const;
export const PAY_CTA_IDS = ["checkout-confirm-pay", "checkout-card-pay"] as const;
export type CheckoutClick = Readonly<{ session_key: string; created_at: string; cta_id: string }>;

// "all" = 전체 유입, "key" = 키콘 전체, 그 밖에는 키콘 영상 ID
export type FunnelFilter = string;

// 비즈니스PT·주간 매출 화면과 같은 토요일~금요일 주차 (한국시간). 마지막 주가 오늘이 든 주다.
export function saturdayWeeks(now: number, count: number): ReportRange[] {
  const today = Math.floor((now + KST_MS) / DAY_MS);
  const saturday = today - ((new Date(today * DAY_MS).getUTCDay() + 1) % 7);
  return Array.from({ length: count }, (_, index) => {
    const start = (saturday - (count - 1 - index) * 7) * DAY_MS - KST_MS;
    return { start: new Date(start).toISOString(), end: new Date(start + 7 * DAY_MS).toISOString() };
  });
}

export function buildWeeklyFunnel(input: AttributionSources & Readonly<{
  checkoutClicks: readonly CheckoutClick[];
  weeks: readonly ReportRange[];
  filter: FunnelFilter;
}>) {
  const { events, payments, isCustomer, keyOf, orderSources } = attributionContext(input);
  const matches = (key: string) => input.filter === "all" || (input.filter === "key" ? key !== UNKNOWN : key === input.filter);
  return input.weeks.map((week) => {
    const inWeek = (time: string) => Date.parse(time) >= Date.parse(week.start) && Date.parse(time) < Date.parse(week.end);
    const landing = new Set<string>();
    const cta = new Set<string>();
    const checkout = new Set<string>();
    // 랜딩 방문마다: 신청·구매 화면·로그인으로 넘어갔는지, 넘어가지 않았다면 떠날 때 보던 구간
    const visits = new Map<string, { moved: boolean; section: string | null; left: boolean }>();
    const visitOf = (id: string) => {
      let visit = visits.get(id);
      if (!visit) { visit = { moved: false, section: null, left: false }; visits.set(id, visit); }
      return visit;
    };
    for (const event of events) {
      const p = event.payload;
      if (!inWeek(event.created_at) || isCustomer(event) || !matches(keyOf(event))) continue;
      if (p.purpose === "landing" && p.kind === "page") { landing.add(p.visitorId); visitOf(p.visitId); }
      else if (p.purpose === "landing" && p.kind === "purchase_click") { cta.add(p.visitorId); visitOf(p.visitId).moved = true; }
      else if (p.purpose === "checkout" && p.kind === "page") { checkout.add(p.visitorId); visitOf(p.visitId).moved = true; }
      else if (p.purpose === "login" || p.kind === "login_click") visitOf(p.visitId).moved = true;
      else if (p.purpose === "landing" && p.kind === "leave") Object.assign(visitOf(p.visitId), { section: p.section ?? null, left: true });
    }
    // 구매 버튼·결제창은 이번 주 구매 선택 화면에 들어온 브라우저 안에서만 센다 (제외·출처 규칙을 그대로 물려받음).
    const clicked = (ids: readonly string[]) => new Set(input.checkoutClicks
      .filter((click) => inWeek(click.created_at) && ids.includes(click.cta_id) && checkout.has(click.session_key))
      .map((click) => click.session_key));
    const orders = new Set<string>();
    for (const payment of payments) {
      if (!inWeek(paymentTime(payment))) continue;
      if (input.filter === "all" || matches(orderSources(payment).last)) orders.add(payment.order_id || payment.id);
    }
    const exits = new Map<string, number>();
    let stayedVisits = 0;
    let unrecorded = 0;
    for (const visit of visits.values()) {
      if (visit.moved) continue;
      stayedVisits += 1;
      if (!visit.left || !visit.section) { unrecorded += 1; continue; }
      exits.set(visit.section, (exits.get(visit.section) ?? 0) + 1);
    }
    return {
      ...week,
      stages: { landing: landing.size, cta: cta.size, checkout: checkout.size,
        select: clicked(SELECT_CTA_IDS).size, pay: clicked(PAY_CTA_IDS).size, paid: orders.size },
      exits: [...exits.entries()].sort((a, b) => b[1] - a[1]).map(([section, count]) => ({ section, count })),
      stayedVisits, unrecorded,
    };
  });
}
