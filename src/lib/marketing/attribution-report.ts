import { keySource, paymentNet, paymentTime } from "./attribution-model";
import type { AttributionEvent, AttributionPayment } from "./attribution-model";

export type ReportRange = Readonly<{ start: string; end: string }>;
const LOOKBACK_MS = 30 * 86400000;
export const UNKNOWN = "unattributed";

export type AttributionSources = Readonly<{
  events: readonly AttributionEvent[];
  payments: readonly AttributionPayment[];
  internalUsers: ReadonlySet<string>;
}>;

// 키콘별 표와 주차별 단계 표가 같은 제외·출처 규칙을 쓰도록 한곳에 둔다.
export function attributionContext(input: AttributionSources) {
  const ordered = [...input.events].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const usersByVisit = new Map<string, Set<string>>();
  const usersByBrowser = new Map<string, Set<string>>();
  for (const event of ordered) {
    const { userId, visitId, visitorId } = event.payload;
    if (!userId) continue;
    for (const [map, key] of [[usersByVisit, visitId], [usersByBrowser, visitorId]] as const) {
      const users = map.get(key) ?? new Set<string>();
      users.add(userId); map.set(key, users);
    }
  }
  const resolvedUser = (event: AttributionEvent) => {
    if (event.payload.userId) return event.payload.userId;
    const users = usersByVisit.get(event.payload.visitId);
    return users?.size === 1 ? [...users][0] : null;
  };
  const events = ordered.filter((event) => !event.payload.test && event.payload.audience !== "internal" &&
    !input.internalUsers.has(resolvedUser(event) ?? ""));
  const payments = input.payments.filter((payment) => paymentNet(payment) > 0 && !input.internalUsers.has(payment.user_id));
  const paidBefore = (userId: string | null, time: string) => !!userId && payments.some((payment) =>
    payment.user_id === userId && Date.parse(paymentTime(payment)) <= Date.parse(time));
  const isCustomer = (event: AttributionEvent) =>
    event.payload.audience === "customer" || paidBefore(resolvedUser(event), event.created_at);
  // 각 이벤트의 출처 = 같은 브라우저에서 30일 안에 마지막으로 관측된 유입 출처
  const keyByEvent = new Map<AttributionEvent, string>();
  const lastSourceByBrowser = new Map<string, { key: string; time: string }>();
  for (const event of events) {
    const p = event.payload;
    if (p.source) lastSourceByBrowser.set(p.visitorId, { key: keySource(p.source) ?? UNKNOWN, time: event.created_at });
    const last = lastSourceByBrowser.get(p.visitorId);
    keyByEvent.set(event, last && Date.parse(event.created_at) - Date.parse(last.time) <= LOOKBACK_MS ? last.key : UNKNOWN);
  }
  const orderSources = (payment: AttributionPayment) => {
    const time = paymentTime(payment);
    const touches = events.filter((event) => {
      const delta = Date.parse(time) - Date.parse(event.created_at);
      if (delta < 0 || delta > LOOKBACK_MS || !event.payload.source) return false;
      const userId = resolvedUser(event);
      if (userId) return userId === payment.user_id;
      const browserUsers = usersByBrowser.get(event.payload.visitorId);
      return event.payload.visitorId === payment.session_key && (!browserUsers || browserUsers.size <= 1);
    });
    const first = touches[0];
    const last = touches[touches.length - 1];
    return { first: first ? keySource(first.payload.source) ?? UNKNOWN : UNKNOWN,
      last: last ? keySource(last.payload.source) ?? UNKNOWN : UNKNOWN };
  };
  return { events, payments, resolvedUser, isCustomer, keyOf: (event: AttributionEvent) => keyByEvent.get(event) ?? UNKNOWN,
    orderSources };
}

export function buildAttributionReport(input: AttributionSources & Readonly<{ range: ReportRange }>) {
  const { events, payments, resolvedUser, isCustomer, keyOf, orderSources } = attributionContext(input);
  const inRange = (time: string) => Date.parse(time) >= Date.parse(input.range.start) && Date.parse(time) < Date.parse(input.range.end);
  const rows = new Map<string, {
    key: string; pageViews: number; browsers: Set<string>; visits: Set<string>; members: Set<string>;
    customerPageViews: number; purchaseClicks: Set<string>; checkoutVisits: Set<string>;
    firstTouchOrders: Set<string>; orders: Set<string>; buyers: Set<string>; revenue: number;
  }>();
  const rowFor = (key: string) => {
    let row = rows.get(key);
    if (!row) {
      row = { key, pageViews: 0, browsers: new Set(), visits: new Set(), members: new Set(),
        customerPageViews: 0, purchaseClicks: new Set(), checkoutVisits: new Set(),
        firstTouchOrders: new Set(), orders: new Set(), buyers: new Set(), revenue: 0 };
      rows.set(key, row);
    }
    return row;
  };
  let courseViews = 0;
  let customerCourseViews = 0;
  let loginClicks = 0;
  let unknownViews = 0;
  let accessOnlyViews = 0;
  const periodBrowsers = new Set<string>();
  const periodVisits = new Set<string>();
  const periodMembers = new Set<string>();
  for (const event of events) {
    const p = event.payload;
    const userId = resolvedUser(event);
    const customer = isCustomer(event);
    const key = keyOf(event);
    if (!inRange(event.created_at)) continue;
    if (p.purpose === "course" && p.kind === "page") {
      courseViews += 1;
      if (customer) customerCourseViews += 1;
      continue;
    }
    if (p.kind === "login_click") { loginClicks += 1; continue; }
    if (p.purpose === "login" || p.purpose === "course" || p.kind === "identity" || p.kind === "leave" || p.kind === "view") continue;
    const row = rowFor(key);
    if (customer) {
      if (p.purpose === "landing" && p.kind === "page") row.customerPageViews += 1;
      continue;
    }
    if (p.kind === "purchase_click") row.purchaseClicks.add(p.visitId);
    if (p.purpose === "checkout" && p.kind === "page") row.checkoutVisits.add(p.visitId);
    if (p.purpose !== "landing" || p.kind !== "page") continue;
    row.pageViews += 1; row.browsers.add(p.visitorId); row.visits.add(p.visitId);
    periodBrowsers.add(p.visitorId); periodVisits.add(p.visitId);
    if (userId) { row.members.add(userId); periodMembers.add(userId); }
    else unknownViews += 1;
    if (p.audience === "access_only") accessOnlyViews += 1;
  }
  const countedOrders = new Set<string>();
  const periodBuyers = new Set<string>();
  for (const payment of payments) {
    const order = payment.order_id || payment.id;
    if (!inRange(paymentTime(payment)) || countedOrders.has(order)) continue;
    countedOrders.add(order); periodBuyers.add(payment.user_id);
    const sources = orderSources(payment);
    rowFor(sources.first).firstTouchOrders.add(order);
    const row = rowFor(sources.last);
    row.orders.add(order); row.buyers.add(payment.user_id); row.revenue += paymentNet(payment);
  }
  return {
    rows: [...rows.values()].map((row) => ({
      key: row.key, pageViews: row.pageViews, browsers: row.browsers.size, visits: row.visits.size,
      members: row.members.size, repeatVisits: Math.max(0, row.visits.size - row.browsers.size),
      customerPageViews: row.customerPageViews, purchaseClicks: row.purchaseClicks.size,
      checkoutVisits: row.checkoutVisits.size, firstTouchOrders: row.firstTouchOrders.size,
      orders: row.orders.size, buyers: row.buyers.size, revenue: row.revenue,
    })),
    totals: { browsers: periodBrowsers.size, visits: periodVisits.size, members: periodMembers.size,
      repeatVisits: Math.max(0, periodVisits.size - periodBrowsers.size), buyers: periodBuyers.size,
      orders: countedOrders.size, courseViews, customerCourseViews, loginClicks, unknownViews, accessOnlyViews },
    recordedFrom: events[0]?.created_at ?? null,
  };
}
