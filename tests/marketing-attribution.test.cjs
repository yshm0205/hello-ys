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
const { attributionInput } = load("src/lib/marketing/attribution-model.ts");
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
