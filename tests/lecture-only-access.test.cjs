const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const { once } = require("node:events");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const userId = "10000000-0000-4000-8000-000000000001";
const now = new Date("2026-10-20T03:00:00.000Z");
const expiresAt = "2026-11-20T03:00:00.000Z";
const expiredPlan = {
  plan_type: "student_4m",
  expires_at: "2026-09-17T11:46:52.217Z",
  credits: 0,
  subscription_credits: 0,
  purchased_credits: 0,
  monthly_credit_amount: 400,
  monthly_credit_total_cycles: 4,
  monthly_credit_granted_cycles: 4,
  next_credit_at: null,
};

function harness(options = {}) {
  const plan = Object.freeze({ ...expiredPlan, ...options.plan });
  const user = {
    id: userId,
    email: "student@example.test",
    app_metadata: options.appMetadata ?? {},
    user_metadata: options.userMetadata ?? {},
  };
  const admin = {
    auth: { admin: { getUserById: async (id) => {
      assert.equal(id, userId);
      return options.authError
        ? { data: { user: null }, error: { message: "lookup failed" } }
        : { data: { user }, error: null };
    } } },
    from(table) {
      const rows = {
        user_plans: plan,
        challenge_enrollments: options.enrollment ?? null,
        challenge_mission_submissions: options.submissions ?? [],
        lectures: [{
          id: "lecture",
          vod_number: 26,
          vod_title: "Test lecture",
          duration_minutes: 10,
          video_url: "fixtureVideoId",
          is_published: true,
        }],
      };
      assert.ok(Object.hasOwn(rows, table), `Unexpected table: ${table}`);
      const result = { data: rows[table], error: null };
      const query = {
        select() { return query; },
        eq() { return query; },
        order() { return query; },
        limit() { return query; },
        in() { return query; },
        maybeSingle: async () => result,
        then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
      };
      return query;
    },
  };
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    const instance = new Module(filename, module);
    instance.filename = filename;
    instance.paths = Module._nodeModulePaths(path.dirname(filename));
    cache.set(filename, instance);
    const nativeRequire = instance.require.bind(instance);
    instance.require = (name) => {
      if (name === "server-only") return {};
      if (name === "@/utils/supabase/admin") return { createAdminClient: () => admin };
      if (name === "@/utils/supabase/server") return {
        createClient: async () => ({
          auth: { getUser: async () => ({ data: { user: options.anonymous ? null : user }, error: null }) },
        }),
      };
      if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
      return nativeRequire(name);
    };
    instance._compile(compiled, filename);
    return instance.exports;
  }
  return { load, plan };
}

test("lecture-only grant unlocks every lecture while the program stays expired", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const { load, plan } = harness({ appMetadata: { lecture_access_expires_at: expiresAt } });
  const originalPlan = { ...plan };
  const access = load("src/lib/challenge/access.ts");

  const result = await access.getLectureAccessForUser(userId, plan);

  assert.deepEqual(result, { mode: "full", allowedVodIds: null });
  assert.equal(load("src/lib/plans/config.ts").isActiveAccessPlan(plan.plan_type, plan.expires_at), false);
  assert.deepEqual(plan, originalPlan);
});

for (const value of [undefined, null, "", "invalid", 9999999999999, "2026-10-20T03:00:00.000Z", "2026-10-19T03:00:00.000Z"]) {
  test(`missing, invalid or expired lecture grant fails closed: ${String(value)}`, async (t) => {
    t.mock.timers.enable({ apis: ["Date"], now });
    const { load, plan } = harness({ appMetadata: { lecture_access_expires_at: value } });

    const result = await load("src/lib/challenge/access.ts").canAccessLectureVod(userId, plan, "vod_26");

    assert.equal(result, false);
  });
}

test("self-editable user metadata cannot grant lecture access", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const { load, plan } = harness({ userMetadata: { lecture_access_expires_at: expiresAt } });

  const result = await load("src/lib/challenge/access.ts").canAccessLectureVod(userId, plan, "vod_26");

  assert.equal(result, false);
});

test("failed account lookup does not grant lecture access", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const { load, plan } = harness({ authError: true });

  const result = await load("src/lib/challenge/access.ts").canAccessLectureVod(userId, plan, "vod_26");

  assert.equal(result, false);
});

test("existing challenge access still unlocks only eligible lectures", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const { load, plan } = harness({
    enrollment: {
      id: "enrollment",
      cohort: "test",
      status: "active",
      access_starts_at: "2026-10-19T00:00:00.000Z",
      access_ends_at: "2026-10-22T00:00:00.000Z",
    },
    submissions: [{ day: 1, status: "approved" }],
  });

  const result = await load("src/lib/challenge/access.ts").getLectureAccessForUser(userId, plan);

  assert.deepEqual(result, { mode: "challenge", allowedVodIds: ["vod_04", "vod_08"] });
});

test("active paid plan keeps full lecture access without a separate grant", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const { load, plan } = harness({ plan: { expires_at: expiresAt } });

  const result = await load("src/lib/challenge/access.ts").getLectureAccessForUser(userId, plan);

  assert.deepEqual(result, { mode: "full", allowedVodIds: null });
});

test("lecture-only account goes to lectures after a default login", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const { load } = harness({ appMetadata: { lecture_access_expires_at: expiresAt } });

  const destination = await load("src/lib/plans/server.ts").resolvePostLoginRedirectPath(userId, "/dashboard");

  assert.equal(destination, "/dashboard/lectures");
});

test("expired lecture-only account returns to the normal expired-account destination", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date(expiresAt) });
  const { load } = harness({ appMetadata: { lecture_access_expires_at: expiresAt } });

  const destination = await load("src/lib/plans/server.ts").resolvePostLoginRedirectPath(userId, "/dashboard");

  assert.equal(destination, "/checkout/allinone");
});

for (const scenario of [
  { name: "active lecture-only grant", appMetadata: { lecture_access_expires_at: expiresAt }, vodId: "vod_26", status: 200 },
  { name: "expired grant", appMetadata: { lecture_access_expires_at: now.toISOString() }, vodId: "vod_26", status: 403 },
  { name: "missing grant", vodId: "vod_26", status: 403 },
  { name: "anonymous request", anonymous: true, vodId: "vod_26", status: 401 },
  { name: "invalid lecture ID", appMetadata: { lecture_access_expires_at: expiresAt }, vodId: "invalid", status: 400 },
]) {
  test(`running playback endpoint: ${scenario.name}`, async (t) => {
    t.mock.timers.enable({ apis: ["Date"], now });
    const { load } = harness(scenario);
    const route = load("src/app/api/lectures/otp/route.ts");
    const originalFetch = global.fetch;
    let providerCalls = 0;
    t.mock.method(global, "fetch", async (url, init) => {
      if (String(url).startsWith("https://dev.vdocipher.com/")) {
        providerCalls++;
        assert.equal(String(url), "https://dev.vdocipher.com/api/videos/fixtureVideoId/otp");
        return Response.json({ otp: "fixture-otp", playbackInfo: "fixture-playback" });
      }
      return originalFetch(url, init);
    });
    const server = http.createServer(async (request, response) => {
      try {
        const body = [];
        for await (const chunk of request) body.push(chunk);
        const result = await route.POST(new Request("http://localhost/api/lectures/otp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: Buffer.concat(body),
        }));
        response.writeHead(result.status, Object.fromEntries(result.headers));
        response.end(await result.text());
      } catch (error) {
        response.writeHead(500);
        response.end(String(error));
      }
    });
    t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
    const listening = once(server, "listening");
    server.listen(0, "127.0.0.1");
    await listening;

    const result = await fetch(`http://127.0.0.1:${server.address().port}/api/lectures/otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ vodId: scenario.vodId }),
      signal: AbortSignal.timeout(10000),
    });

    assert.equal(result.status, scenario.status);
    assert.equal(providerCalls, scenario.status === 200 ? 1 : 0);
    if (scenario.status === 200) {
      assert.deepEqual(await result.json(), { otp: "fixture-otp", playbackInfo: "fixture-playback" });
    } else {
      assert.equal(typeof (await result.json()).error, "string");
    }
  });
}
