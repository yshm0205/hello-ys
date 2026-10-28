const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  cache.set(filename, instance);
  const original = instance.require.bind(instance);
  instance.require = (name) => name.startsWith("./")
    ? load(path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`))) : original(name);
  instance._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return instance.exports;
}
const { buildAttributionReport } = load("src/lib/marketing/attribution-report.ts");
const { nextVisit } = load("src/lib/marketing/attribution-browser.ts");
const { attributionInput, keySource } = load("src/lib/marketing/attribution-model.ts");
const { buildWeeklyFunnel, saturdayWeeks } = load("src/lib/marketing/attribution-funnel.ts");
const { keyContentDestination } = load("src/lib/marketing/key-content-links.ts");
const A = "2A095uwYkHs";
const B = "-WxxxydhIuQ";
const uid = "11111111-1111-4111-8111-111111111111";
const visitor = "22222222-2222-4222-8222-222222222222";
const visit = "33333333-3333-4333-8333-333333333333";
const range = { start: "2026-10-01T00:00:00.000Z", end: "2026-11-01T00:00:00.000Z" };
function event(day, overrides = {}) {
  return { id: `e-${day}-${overrides.visitId ?? visit}`, session_key: overrides.visitorId ?? visitor,
    created_at: `2026-10-${String(day).padStart(2, "0")}T10:00:00.000Z`, payload: {
      version: 2, kind: "page", purpose: "landing", path: "/ko", userId: null, audience: "unknown", test: false,
      visitorId: visitor, visitId: visit, source: null, referrerHost: null, ...overrides,
    } };
}
function source(content) { return { source: "youtube", medium: "organic_video", campaign: "allinone", content, placement: "pin" }; }
function payment(overrides = {}) {
  return { id: "p1", order_id: "order-1", user_id: uid, session_key: visitor, amount: 499000,
    status: "DONE", created_at: "2026-10-04T09:00:00.000Z", metadata: { planType: "allinone", confirmedAt: "2026-10-04T12:00:00.000Z" }, ...overrides };
}
function report(events, payments = [], extra = {}) {
  return buildAttributionReport({ events, payments, internalUsers: new Set(), range, ...extra });
}

test("repeat visits stay one browser while visits and page views differ", () => {
  // Given: the same browser opens three pages in two visits.
  const input = [event(1, { source: source(A) }), event(1), event(2, { visitId: "visit-2" })];
  // When
  const result = report(input);
  // Then
  assert.deepEqual([result.rows[0].pageViews, result.totals.browsers, result.totals.visits, result.totals.repeatVisits], [3, 1, 2, 1]);
});
test("same authenticated account across devices is one confirmed member", () => {
  // Given
  const input = [event(1, { userId: uid }), event(2, { userId: uid, visitorId: "browser-2", visitId: "visit-2" })];
  // When
  const result = report(input);
  // Then
  assert.deepEqual([result.totals.browsers, result.totals.members], [2, 1]);
});
test("a login resolves anonymous events only inside an unambiguous visit", () => {
  // Given
  const input = [event(1), event(1, { kind: "identity", userId: uid })];
  // When
  const result = report(input);
  // Then
  assert.deepEqual([result.totals.members, result.totals.unknownViews], [1, 0]);
});
test("two accounts sharing a visit do not claim its anonymous views", () => {
  // Given
  const input = [event(1), event(1, { kind: "identity", userId: uid }), event(1, { kind: "identity", userId: "another" })];
  // When
  const result = report(input);
  // Then
  assert.equal(result.totals.unknownViews, 1);
});
test("first and last touch differ without double-counting revenue", () => {
  // Given
  const input = [event(1, { source: source(A) }), event(3, { source: source(B), visitId: "visit-2", userId: uid }), event(4, { userId: uid })];
  // When
  const result = report(input, [payment(), payment()]);
  // Then
  assert.equal(result.rows.find((row) => row.key === A).firstTouchOrders, 1);
  assert.equal(result.rows.find((row) => row.key === A).revenue, 0);
  assert.equal(result.rows.find((row) => row.key === B).revenue, 499000);
  assert.equal(result.totals.orders, 1);
});
test("post-purchase course and landing visits are excluded but pre-purchase visits remain", () => {
  // Given
  const input = [event(1, { userId: uid }), event(5, { userId: uid }), event(6, { userId: uid, purpose: "course" })];
  // When
  const result = report(input, [payment()]);
  // Then
  assert.deepEqual([result.rows[0].pageViews, result.rows[0].customerPageViews, result.totals.customerCourseViews], [1, 1, 1]);
});
test("login clicks and access-only grants do not become purchases", () => {
  // Given
  const input = [event(1, { audience: "access_only", userId: uid }), event(2, { kind: "login_click" })];
  // When
  const result = report(input, [payment({ metadata: { planType: "allinone", complimentary: true } })]);
  // Then
  assert.deepEqual([result.totals.accessOnlyViews, result.totals.loginClicks, result.rows[0].purchaseClicks, result.totals.buyers], [1, 1, 0, 0]);
});
test("pending and cancelled orders are excluded; partial refunds reduce revenue", () => {
  // Given
  const paid = payment({ status: "PARTIAL_CANCELLED", metadata: { planType: "allinone", cancelledAmount: 100000 } });
  // When
  const result = report([], [payment({ status: "PENDING" }), payment({ status: "CANCELLED" }), paid]);
  // Then
  assert.deepEqual([result.totals.orders, result.rows[0].revenue], [1, 399000]);
});
test("missing or stale attribution remains unknown", () => {
  // Given: a purchase more than 30 days after the only recorded touch.
  const old = { ...event(1, { source: source(A) }), created_at: "2026-08-01T10:00:00.000Z" };
  // When
  const result = report([old], [payment()]);
  // Then
  assert.equal(result.rows.find((row) => row.orders === 1).key, "unattributed");
});
test("internal and test records never inflate acquisition", () => {
  // Given
  const input = [event(1, { test: true }), event(2, { audience: "internal", userId: uid })];
  // When
  const result = report(input, [payment()], { internalUsers: new Set([uid]) });
  // Then
  assert.deepEqual([result.totals.visits, result.totals.buyers], [0, 0]);
});
test("session rolls over after thirty minutes, not after a page reload", () => {
  // Given
  const previous = { id: visit, lastActive: 1000 };
  // When
  const recent = nextVisit(previous, 1799999, () => "new");
  const expired = nextVisit(previous, 1801000, () => "new");
  // Then
  assert.deepEqual([recent.id, expired.id], [visit, "new"]);
});
test("client cannot claim a trusted user identity or customer status", () => {
  // Given
  const input = { id: uid, visitorId: visitor, visitId: visit, kind: "page", path: "/ko", source: null, referrerHost: null, token: uid, userId: uid, audience: "customer" };
  // When
  const parsed = attributionInput.safeParse(input);
  // Then
  assert.equal(parsed.success, false);
});
test("video links keep their source and placement and reject unknown redirects", () => {
  // Given
  const destination = keyContentDestination(B, "description");
  // When
  const url = new URL(destination, "https://flowspot.kr");
  // Then
  assert.deepEqual([url.searchParams.get("utm_content"), url.searchParams.get("placement"), keyContentDestination("evil", "pin")], [B, "description", null]);
});
test("business PT bit.ly visits count as the key content named in utm_campaign", () => {
  // Given: the bit.ly destinations made by business PT carry the video URL in utm_campaign.
  const short = { source: "google", medium: "infeed", campaign: `https://youtu.be/${A}`, content: "", placement: "" };
  const watch = { ...short, campaign: `https://www.youtube.com/watch%3Fv%3D${B}` };
  const other = { ...short, campaign: "https://youtu.be/AAAAAAAAAAA" };
  // When
  const keys = [short, watch, other, { ...short, campaign: "brand_search" }].map(keySource);
  // Then
  assert.deepEqual(keys, [A, B, null, null]);
});
test("saturday weeks follow KST and end with the current week", () => {
  // Given: Wednesday 2026-10-28 01:00 KST.
  const now = Date.parse("2026-10-27T16:00:00.000Z");
  // When
  const weeks = saturdayWeeks(now, 2);
  // Then: Saturday 10/17 and 10/24 00:00 KST.
  assert.deepEqual(weeks.map((week) => week.start), ["2026-10-16T15:00:00.000Z", "2026-10-23T15:00:00.000Z"]);
  assert.equal(weeks[1].end, "2026-10-30T15:00:00.000Z");
});
test("weekly funnel counts each stage once per browser and keeps key filters", () => {
  // Given: a bit.ly visitor who goes all the way to payment, and an unattributed visitor who only reads.
  const week = { start: "2026-10-03T15:00:00.000Z", end: "2026-10-10T15:00:00.000Z" };
  const bitly = { source: "google", medium: "infeed", campaign: `https://youtu.be/${A}`, content: "", placement: "" };
  const other = "44444444-4444-4444-8444-444444444444";
  const events = [
    event(4, { source: bitly }), event(4, { source: bitly }), event(4, { kind: "purchase_click" }),
    event(4, { purpose: "checkout", path: "/ko/checkout/allinone" }),
    event(5, { visitorId: other, visitId: "visit-other" }),
    event(5, { visitorId: other, visitId: "visit-other", kind: "leave", section: "reviews", scroll: 70 }),
  ];
  const checkoutClicks = [
    { session_key: visitor, created_at: "2026-10-04T10:01:00.000Z", cta_id: "checkout-select-purchase" },
    { session_key: visitor, created_at: "2026-10-04T10:03:00.000Z", cta_id: "checkout-confirm-pay" },
    { session_key: other, created_at: "2026-10-05T10:03:00.000Z", cta_id: "checkout-select-purchase" },
  ];
  const run = (filter) => buildWeeklyFunnel({ events, payments: [payment({ user_id: "buyer" })], internalUsers: new Set(),
    checkoutClicks, weeks: [week], filter })[0];
  // When
  const all = run("all");
  const key = run(A);
  // Then: the reader's checkout button click without a checkout page visit is not counted.
  assert.deepEqual(all.stages, { landing: 2, cta: 1, checkout: 1, select: 1, pay: 1, paid: 1 });
  assert.deepEqual(key.stages, { landing: 1, cta: 1, checkout: 1, select: 1, pay: 1, paid: 1 });
  assert.deepEqual([all.exits, all.stayedVisits, all.unrecorded], [[{ section: "reviews", count: 1 }], 1, 0]);
  assert.deepEqual([key.exits, key.stayedVisits], [[], 0]);
});
test("weekly funnel leaves out customers and visits that moved on", () => {
  // Given: a buyer returns after paying; another visit moves to login without a leave record.
  const week = { start: "2026-10-03T15:00:00.000Z", end: "2026-10-10T15:00:00.000Z" };
  const events = [event(5, { userId: uid }), event(6, { visitorId: "b2", visitId: "v2" }),
    event(6, { visitorId: "b2", visitId: "v2", kind: "login_click" }), event(7, { visitorId: "b3", visitId: "v3" })];
  // When
  const result = buildWeeklyFunnel({ events, payments: [payment()], internalUsers: new Set(), checkoutClicks: [], weeks: [week], filter: "all" })[0];
  // Then
  assert.deepEqual([result.stages.landing, result.stayedVisits, result.unrecorded], [2, 1, 1]);
});
test("database timezone formatting preserves inclusive start and exclusive end", () => {
  // Given: PostgreSQL returns an offset while the report range uses Z.
  const first = { ...event(1), created_at: "2026-10-01T00:00:00.000000+00:00" };
  const next = { ...event(2), created_at: "2026-11-01T00:00:00.000000+00:00" };
  // When
  const result = report([first, next]);
  // Then
  assert.equal(result.rows[0].pageViews, 1);
  assert.equal(result.recordedFrom, first.created_at);
});

test("visible section checkpoints are accepted without trusting client identity", () => {
  // Given
  const input = { id: uid, visitorId: visitor, visitId: visit, kind: "view", path: "/ko",
    source: null, referrerHost: null, token: uid, section: "faq", scroll: 90,
    observedAt: "2026-10-05T10:00:00.000Z" };
  // When
  const parsed = attributionInput.safeParse(input);
  // Then
  assert.equal(parsed.success, true);
  assert.equal(attributionInput.safeParse({ ...input, observedAt: "invalid" }).success, false);
  assert.equal(attributionInput.safeParse({ ...input, userId: uid }).success, false);
});

test("last observed section survives missing unload and out-of-order delivery", () => {
  // Given: the older checkpoint arrives after FAQ and no unload event arrives.
  const events = [event(4), event(5, { kind: "view", section: "faq", observedAt: "2026-10-05T10:00:00.000Z" }),
    event(6, { kind: "view", section: "reviews", observedAt: "2026-10-05T09:59:00.000Z" })];
  // When
  const result = buildWeeklyFunnel({ events, payments: [], internalUsers: new Set(), checkoutClicks: [],
    weeks: [range], filter: "all" })[0];
  // Then
  assert.deepEqual(result.exits, [{ section: "faq", count: 1 }]);
  assert.equal(result.unrecorded, 0);
  assert.equal(report(events).rows[0].pageViews, 1);
});

test("checkpoint visits that proceed or are test/internal never become exits", () => {
  // Given
  const events = [event(4), event(4, { kind: "view", section: "reviews" }), event(4, { kind: "login_click" }),
    event(5, { kind: "view", section: "faq", test: true, visitorId: "test", visitId: "test" }),
    event(5, { kind: "view", section: "faq", audience: "internal", visitorId: "admin", visitId: "admin" })];
  // When
  const result = buildWeeklyFunnel({ events, payments: [], internalUsers: new Set(), checkoutClicks: [],
    weeks: [range], filter: "all" })[0];
  // Then
  assert.deepEqual(result.exits, []);
  assert.equal(result.stayedVisits, 0);
});

test("an empty close observation cannot erase a known section and old leave events still work", () => {
  const events = [event(4), event(5, { kind: "view", section: "reviews", observedAt: "2026-10-05T10:00:00.000Z" }),
    event(6, { kind: "leave", section: null }), event(7, { kind: "leave", section: "faq" })];
  const input = { events, payments: [], internalUsers: new Set(), checkoutClicks: [], weeks: [range], filter: "all" };
  assert.deepEqual(buildWeeklyFunnel({ ...input, events: events.slice(0, 3) })[0].exits, [{ section: "reviews", count: 1 }]);
  assert.deepEqual(buildWeeklyFunnel(input)[0].exits, [{ section: "faq", count: 1 }]);
});
