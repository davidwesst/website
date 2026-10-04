import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createDeployment, readDeployment, validateDeployment } from "../lib/deployment-identity.js";
import { waitForRelease } from "../lib/hosting-readiness.js";
import { createRequest, HostingFailure } from "../lib/hosting-request.js";
import { checkIdentity, checkRedirects, checkSite, parseRedirects } from "../lib/hosting-checks.js";

const expected = { schemaVersion: 1, commit: "a".repeat(40), buildId: "github-123-1" };
const origin = "https://example.com";
function response(status, headers = {}, body = "", url = origin) {
  return { status, headers: new Headers(headers), bytes: Buffer.from(body), url, diagnostics: { url, status, location: headers.location || null, cfRay: "test-ray", age: "0", cfCacheStatus: "DYNAMIC" } };
}
function clock() {
  let time = 0;
  return { now: () => time, delay: async (ms) => { time += ms; }, advance: (ms) => { time += ms; } };
}
function readiness(overrides = {}) {
  return { expected, ...clock(), log: () => {}, timeoutMs: 40, intervalMs: 5, checkIdentity: async () => expected, checkSite: async () => {}, ...overrides };
}

test("identity generation distinguishes CI attempts and local builds", () => {
  const env = { GITHUB_ACTIONS: "true", GITHUB_SHA: expected.commit, GITHUB_RUN_ID: "123", GITHUB_RUN_ATTEMPT: "1" };
  assert.deepEqual(createDeployment({ env }), expected);
  assert.notEqual(createDeployment({ env: { ...env, GITHUB_RUN_ATTEMPT: "2" } }).buildId, expected.buildId);
  assert.notEqual(createDeployment({ env: {}, gitCommit: () => expected.commit }).buildId, createDeployment({ env: {}, gitCommit: () => expected.commit }).buildId);
  assert.throws(() => createDeployment({ env: { ...env, GITHUB_RUN_ATTEMPT: "" } }), /attempt/);
  for (const invalid of [null, {}, { ...expected, schemaVersion: 2 }, { ...expected, commit: 1 }, { ...expected, buildId: "" }]) assert.throws(() => validateDeployment(invalid));
});

test("artifact identity survives deploy-only reruns and rejects mismatched or missing artifacts", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "deployment-test-"));
  try {
    const file = path.join(dir, "deployment.json");
    await assert.rejects(readDeployment(file, expected.commit), { code: "ENOENT" });
    await writeFile(file, JSON.stringify(expected));
    assert.deepEqual(await readDeployment(file, expected.commit), expected);
    // A subsequent deployment attempt uses the saved build identity, not createDeployment().
    assert.notEqual(createDeployment({ env: { GITHUB_ACTIONS: "true", GITHUB_SHA: expected.commit, GITHUB_RUN_ID: "123", GITHUB_RUN_ATTEMPT: "2" } }).buildId, (await readDeployment(file, expected.commit)).buildId);
    await assert.rejects(readDeployment(file, "b".repeat(40)), /workflow commit/);
    await writeFile(file, "{");
    await assert.rejects(readDeployment(file, expected.commit), SyntaxError);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("a healthy old homepage cannot establish readiness; stale identity eventually recovers", async () => {
  let attempts = 0;
  let passes = 0;
  const logs = [];
  const options = readiness({ log: (line) => logs.push(JSON.parse(line)), checkIdentity: async () => {
    attempts += 1;
    return checkIdentity(async (route) => route === "/" ? response(200) : response(200, { "cache-control": "no-store" }, JSON.stringify(attempts < 3 ? { ...expected, buildId: "github-122-1" } : expected)), expected);
  }, checkSite: async () => { passes += 1; } });
  await waitForRelease(options);
  assert.equal(passes, 2);
  assert.equal(logs.length, 2);
  assert.equal(logs[0].observed.buildId, "github-122-1");
  assert.equal(logs[0].cfRay, "test-ray");
});

test("stale identity and matching identity with a permanently broken redirect both time out", async () => {
  for (const failureAt of ["checkIdentity", "checkSite"]) {
    const options = readiness({ [failureAt]: async () => { throw new HostingFailure("persistent 404"); } });
    await assert.rejects(waitForRelease(options), /did not converge.*persistent 404/);
    assert.equal(options.now(), 40);
  }
});

test("intermittent site failures reset the consecutive full-pass count", async () => {
  let passes = 0;
  const options = readiness({ checkSite: async () => { if (++passes === 2) throw new HostingFailure("broken route"); } });
  await waitForRelease(options);
  assert.equal(passes, 4);
  assert.equal(options.now(), 15);
});

test("identity changing after a pass invalidates it", async () => {
  let identities = 0;
  let passes = 0;
  await waitForRelease(readiness({ checkIdentity: async () => {
    if (++identities === 2) throw new HostingFailure("release changed");
    return expected;
  }, checkSite: async () => { passes += 1; } }));
  assert.equal(passes, 3);
});

test("programming errors fail immediately and an over-deadline pass cannot succeed", async () => {
  await assert.rejects(waitForRelease(readiness({ checkSite: async () => { throw new TypeError("bug"); } })), /bug/);
  const fake = clock();
  await assert.rejects(waitForRelease(readiness({ ...fake, checkSite: async () => fake.advance(41) })), /deadline exhausted/);
});

test("malformed and missing remote identity are retryable HTTP contract failures", async () => {
  for (const result of [response(404), response(200, {}, "{"), response(200, {}, JSON.stringify({ ...expected, commit: 42 })), response(200, {}, JSON.stringify(expected))]) {
    await assert.rejects(checkIdentity(async () => result, expected), HostingFailure);
  }
});

test("redirect failures preserve strict status, Location, origin, query, and destination checks", async () => {
  const valid = "/target/?migration=check";
  for (const [status, location] of [[404, valid], [302, valid], [301, null], [301, "http://["], [301, "/wrong/?migration=check"], [301, "/target/"], [301, "https://other.example/target/?migration=check"]]) {
    await assert.rejects(checkRedirects(async () => response(status, location ? { location } : {}), origin, [["/old", "/target/"]]), HostingFailure);
  }
  await assert.rejects(checkRedirects(async (route) => route.startsWith("/old?") ? response(301, { location: valid }) : response(404), origin, [["/old", "/target/"]]), /published/);
});

test("redirect concurrency is capped at six and shared destinations are checked once", async () => {
  let active = 0;
  let maximum = 0;
  let targets = 0;
  const redirects = Array.from({ length: 25 }, (_, i) => [`/old-${i}`, "/target/"]);
  await checkRedirects(async (route) => {
    maximum = Math.max(maximum, ++active);
    await new Promise((resolve) => setImmediate(resolve));
    active -= 1;
    if (route === "/target/") { targets += 1; return response(200); }
    return response(301, { location: "/target/?migration=check" });
  }, origin, redirects);
  assert.equal(maximum, 6);
  assert.equal(targets, 1);
});

test("malformed local redirect files fail before HTTP verification", () => {
  for (const text of ["", "/a /b 302", "/a https://other.example 301", "/a /b 301\n/a /c 301"]) assert.throws(() => parseRedirects(text));
  assert.deepEqual(parseRedirects("/a /b 301\r\n"), [["/a", "/b"]]);
});

test("stalled fetch and response body abort within the remaining budget", async () => {
  for (const stalledBody of [false, true]) {
    let signal;
    const request = createRequest(origin, { now: () => 95, deadline: 100, fetchImpl: async (_url, options) => {
      signal = options.signal;
      if (!stalledBody) return new Promise(() => {});
      return { status: 200, headers: new Headers({ "cf-ray": "stalled-ray" }), arrayBuffer: () => new Promise(() => {}) };
    } });
    await assert.rejects(request("/", { body: true }), (error) => error instanceof HostingFailure && /5ms/.test(error.message));
    assert.equal(signal.aborted, true);
  }
  let called = false;
  await assert.rejects(createRequest(origin, { now: () => 100, deadline: 100, fetchImpl: () => { called = true; } })("/"), /deadline exhausted/);
  assert.equal(called, false);
});

test("transport failures are retryable but programming TypeErrors are not", async () => {
  const network = new TypeError("fetch failed", { cause: new Error("ECONNRESET") });
  await assert.rejects(createRequest(origin, { fetchImpl: async () => { throw network; } })("/"), HostingFailure);
  await assert.rejects(createRequest(origin, { fetchImpl: async () => { throw new TypeError("bug"); } })("/"), TypeError);
});

test("the complete suite still rejects broken page, asset, security, missing-route, dispatcher, and telemetry contracts", async () => {
  const icon = Buffer.from([0, 0, 1, 0, 1, 0]);
  const fixture = async (route) => {
    const headers = { "x-content-type-options": "nosniff" };
    if (route === "/") return response(200, headers, "/assets/telemetry/application-insights.js");
    if (route === "/favicon.ico") return { ...response(200, { ...headers, "content-type": "image/x-icon" }), bytes: icon };
    if (route.startsWith("/blog/gamelog/entry.html?")) return response(200, headers, "URLSearchParams", origin + route);
    if (["/blog/", "/talks/", "/about/", "/feed.xml", "/sitemap.xml", "/assets/main.css", "/assets/telemetry/application-insights.js"].includes(route)) return response(200, headers);
    return response(404);
  };
  const options = { origin, redirects: [], telemetryExpected: true };
  await checkSite(fixture, options);
  for (const [route, replacement] of [["/blog/", response(404)], ["/assets/main.css", response(200)], ["/favicon.ico", response(200)], ["/wp/", response(200)], ["/assets/telemetry/application-insights.js", response(404)], ["/blog/gamelog/entry.html?slug=clair-obscur-expedition-33", response(200, {}, "broken")]]) {
    await assert.rejects(checkSite((requested) => requested === route ? replacement : fixture(requested), options), HostingFailure);
  }
  await assert.rejects(checkSite(fixture, { ...options, telemetryExpected: false }), /telemetry/);
});

test("built operational identity is validated and excluded from discovery", async () => {
  await readDeployment();
  assert.doesNotMatch(await readFile("_site/sitemap.xml", "utf8"), /deployment\.json/);
  assert.doesNotMatch(await readFile("_site/feed.xml", "utf8"), /deployment\.json/);
  assert.match(await readFile("_site/_headers", "utf8"), /\/deployment\.json\s+! Cache-Control\s+Cache-Control: no-store/);
});
