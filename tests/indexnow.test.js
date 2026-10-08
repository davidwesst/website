import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { pendingUrls, submitIndexNow, validateState, sitemapUrls } from "../lib/indexnow.js";
const origin = "https://david.wes.st";
const url = (slug) => `${origin}/${slug}/`;
const hash = "a".repeat(64);
const options = (state, pages) => ({ state, manifest: { schemaVersion: 1, pages }, origin, key: "testkey123", endpoint: "https://api.indexnow.org/indexnow", sleep: async () => {} });

test("IndexNow combines additions, edits, removals and pending URLs; excludes unchanged pages", () => {
  const state = { schemaVersion: 1, baseline: { [url("same")]: hash, [url("edit")]: hash, [url("removed")]: hash }, pending: [url("pending")] };
  const pages = { [url("same")]: hash, [url("edit")]: "b".repeat(64), [url("new")]: hash };
  assert.deepEqual(pendingUrls(state, { schemaVersion: 1, pages }, origin), [url("edit"), url("new"), url("pending"), url("removed")]);
  assert.throws(() => validateState(null, origin), /baseline/);
  assert.throws(() => pendingUrls(state, { schemaVersion: 1, pages: { "https://other.test/": hash } }, origin), /canonical/);
  assert.throws(() => sitemapUrls("<urlset><url><loc>https://david.wes.st/feed.xml</loc></url></urlset>", origin), /canonical/);
});
test("IndexNow bootstrap submits all known URLs, accepts 202, then does nothing for an unchanged release", async () => {
  const state = { schemaVersion: 1, baseline: { [url("old")]: null }, pending: [url("old")] };
  const config = options(state, { [url("new")]: hash });
  let requests = 0;
  const fetchFn = async (_, request) => { requests++; const payload = JSON.parse(request.body); assert.equal(payload.host, "david.wes.st"); assert.deepEqual(payload.urlList, [url("new"), url("old")]); return { status: 202 }; };
  assert.equal(await submitIndexNow({ ...config, fetchFn }), 2);
  assert.deepEqual(state.baseline, config.manifest.pages);
  assert.equal(await submitIndexNow({ ...config, fetchFn }), 0);
  assert.equal(requests, 1);
});
test("partial batch failure retains baseline and all pending URLs for idempotent retry", async () => {
  const state = { schemaVersion: 1, baseline: { [url("removed")]: hash }, pending: [] };
  const previous = { ...state.baseline };
  let requests = 0;
  const config = options(state, { [url("new")]: hash });
  await assert.rejects(submitIndexNow({ ...config, batchSize: 1, fetchFn: async () => ({ status: ++requests === 1 ? 200 : 503 }) }), /exhausted/);
  assert.equal(requests, 4);
  assert.deepEqual(state.baseline, previous);
  assert.deepEqual(state.pending, [url("new"), url("removed")]);
  assert.equal(await submitIndexNow({ ...config, fetchFn: async () => ({ status: 200 }) }), 2);
  assert.deepEqual(state.pending, []);
});
test("IndexNow retries transport and rate limits but stops permanent rejection", async () => {
  const state = { schemaVersion: 1, baseline: {}, pending: [] };
  let requests = 0;
  await submitIndexNow({ ...options(state, { [url("new")]: hash }), fetchFn: async () => { if (++requests === 1) throw new Error("offline"); if (requests === 2) return { status: 429 }; return { status: 200 }; } });
  assert.equal(requests, 3);
  await assert.rejects(submitIndexNow({ ...options(state, { [url("other")]: hash }), fetchFn: async () => ({ status: 403 }) }), /403/);
  assert.deepEqual(state.pending, [url("new"), url("other")]);
});
test("local, PR and staging execution cannot submit IndexNow requests", () => {
  for (const [branch, event] of [["feature", "push"], ["main", "pull_request"], ["staging", "push"]]) {
    const result = spawnSync(process.execPath, ["tools/indexnow.mjs", "submit"], { encoding: "utf8", env: { ...process.env, GITHUB_REF_NAME: branch, GITHUB_EVENT_NAME: event } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /requires/);
  }
});
