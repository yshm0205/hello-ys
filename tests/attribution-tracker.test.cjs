const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const ts = require("typescript");
const { randomUUID } = require("node:crypto");

function mountTracker(pathname = "/ko", respond = () => ({ ok: true, status: 200 }), initialSection = "landing-hero") {
  let cleanup;
  let section = initialSection;
  let frameId = 0;
  const frames = new Map();
  const requests = [];
  const window = Object.assign(new EventTarget(), { innerHeight: 800, scrollY: 0 });
  const document = Object.assign(new EventTarget(), {
    visibilityState: "visible", referrer: "", documentElement: { scrollHeight: 10000 },
    querySelectorAll: () => [{ id: section, dataset: {}, getBoundingClientRect: () => ({ top: 0, bottom: 800 }) }],
  });
  const modules = {
    react: { useEffect: (effect) => { cleanup = effect(); } },
    "next/navigation": { usePathname: () => pathname, useSearchParams: () => new URLSearchParams("tracking_test=1") },
    "@/utils/supabase/client": { createClient: () => ({ auth: { onAuthStateChange: () => ({
      data: { subscription: { unsubscribe() {} } },
    }) } }) },
    "@/lib/marketing/attribution-browser": {
      attributionIdentity: () => ({ visitorId: "visitor", visitId: "visit", token: "token" }), entrySource: () => null,
    },
    "@/lib/marketing/attribution-model": { pagePurpose: () => pathname === "/ko" ? "landing" : "checkout" },
  };
  const context = vm.createContext({
    exports: {}, window, document, console, URL, Date, AbortSignal,
    crypto: { randomUUID }, sessionStorage: { getItem: () => "1", setItem() {} },
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
    fetch: async (_url, options) => { const request = JSON.parse(options.body); requests.push(request); return respond(request); },
    require: (name) => { assert.ok(modules[name], name); return modules[name]; },
  });
  const filename = path.join(__dirname, "../src/components/analytics/AttributionTracker.tsx");
  vm.runInContext(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  context.exports.AttributionTracker();
  return {
    requests,
    flushFrame() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback()); },
    scrollTo(next, scrollY) { section = next; window.scrollY = scrollY; window.dispatchEvent(new Event("scroll")); },
    hide() { document.visibilityState = "hidden"; document.dispatchEvent(new Event("visibilitychange")); },
    resizeTo(next) { section = next; window.dispatchEvent(new Event("resize")); },
    cleanup: () => cleanup?.(),
  };
}

test("saves the visible section before a tab can close without unload events", () => {
  // Given
  const tracker = mountTracker();
  try {
    tracker.flushFrame();
    // When: move to FAQ without dispatching visibilitychange or pagehide.
    tracker.scrollTo("faq", 8000);
    tracker.flushFrame();
    // Then
    const views = tracker.requests.filter((request) => request.kind === "view");
    assert.deepEqual(views.map((view) => view.section), ["landing-hero", "faq"]);
    assert.ok(views.every((view) => view.test && Number.isFinite(Date.parse(view.observedAt))));
  } finally { tracker.cleanup(); }
});

test("saves the new intro before navigation and keeps section checkpoints without an unload event", () => {
  // Given
  const tracker = mountTracker("/ko", () => ({ ok: true, status: 200 }), "lecture-intro");
  try {
    assert.equal(tracker.requests.at(-1).section, "lecture-intro");
    // When
    tracker.scrollTo("offer", 4000);
    tracker.flushFrame();
    // Then
    const views = tracker.requests.filter((request) => request.kind === "view");
    assert.deepEqual(views.map((view) => view.section), ["lecture-intro", "offer"]);
    assert.equal(tracker.requests.some((request) => request.kind === "purchase_click"), false);
  } finally { tracker.cleanup(); }
});

test("deduplicates same-section checkpoints but flushes the final scroll position", () => {
  // Given
  const tracker = mountTracker();
  try {
    tracker.flushFrame();
    tracker.scrollTo("reviews", 5000); tracker.flushFrame();
    tracker.scrollTo("reviews", 6000); tracker.flushFrame();
    // When
    tracker.hide();
    // Then
    assert.equal(tracker.requests.filter((request) => request.kind === "view" && request.section === "reviews").length, 1);
    assert.equal(tracker.requests.at(-1).kind, "leave");
    assert.equal(tracker.requests.at(-1).scroll, 65);
  } finally { tracker.cleanup(); }
});

test("does not checkpoint checkout pages or keep listeners after cleanup", () => {
  // Given
  const tracker = mountTracker("/ko/checkout/allinone");
  // When
  tracker.scrollTo("faq", 8000); tracker.flushFrame(); tracker.hide(); tracker.cleanup();
  tracker.scrollTo("reviews", 5000); tracker.flushFrame();
  // Then
  assert.deepEqual(tracker.requests.map((request) => request.kind), ["page"]);
});

test("retries with the same observation and allows a failed checkpoint to be sent again", async () => {
  let fail = true;
  const tracker = mountTracker("/ko", (request) => ({ ok: !(fail && request.kind === "view"), status: fail && request.kind === "view" ? 503 : 200 }));
  try {
    await new Promise(setImmediate);
    const failed = tracker.requests.filter((request) => request.kind === "view");
    assert.equal(failed.length, 2);
    assert.equal(failed[0].id, failed[1].id);
    assert.equal(failed[0].observedAt, failed[1].observedAt);
    fail = false;
    tracker.scrollTo("landing-hero", 1); tracker.flushFrame();
    assert.equal(tracker.requests.filter((request) => request.kind === "view").length, 3);
  } finally { tracker.cleanup(); }
});

test("tracks resized landing views and removes pending callbacks on unmount", () => {
  const tracker = mountTracker();
  tracker.resizeTo("reviews"); tracker.flushFrame();
  assert.equal(tracker.requests.at(-1).section, "reviews");
  const count = tracker.requests.length;
  tracker.scrollTo("faq", 8000); tracker.cleanup(); tracker.flushFrame();
  tracker.scrollTo("faq", 8000); tracker.resizeTo("faq"); tracker.flushFrame(); tracker.hide();
  assert.equal(tracker.requests.length, count);
});
