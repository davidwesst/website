import assert from "node:assert/strict";
import test from "node:test";
import { assertPublishContext, githubClient, partitionPosts, publishPosts, waitForDeployment } from "../lib/crosspost-publisher.js";

const post = { id: "abc", title: "Title", aliases: ["https://example.invalid/a/"], files: [{ path: "source/_posts/a.md", bytes: Buffer.from("Body") }, { path: "source/images/a.png", bytes: Buffer.from([1]) }] };
const release = { commit: "source", buildId: "github-1-1" };
const state = () => ({ commit: "target", tree: "old-tree", paths: new Set(), submitted: { ids: new Map(), urls: new Map() } });

test("publishing rejects PRs, staging, manual runs, disabled integration and other repositories", () => {
  const context = { GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "push", GITHUB_REF_NAME: "main", GITHUB_REPOSITORY: "owner/site", WESTERN_DEVS_ENABLED: "true" };
  assertPublishContext(context, "owner/site");
  for (const [key, value] of [["GITHUB_ACTIONS", undefined], ["GITHUB_EVENT_NAME", "pull_request"], ["GITHUB_EVENT_NAME", "workflow_dispatch"], ["GITHUB_REF_NAME", "staging"], ["GITHUB_REPOSITORY", "owner/fork"], ["WESTERN_DEVS_ENABLED", undefined]]) {
    assert.throws(() => assertPublishContext({ ...context, [key]: value }, "owner/site"));
  }
  for (const token of [undefined, "", "   "]) assert.throws(() => githubClient({ token, repository: "owner/repo" }), /WESTERN_DEVS_TOKEN.*personal access token/);
});

test("deduplicates identities and preexisting original URLs regardless of source edits", () => {
  assert.equal(partitionPosts([post], { ids: new Map([["abc", "commit"]]), urls: new Map() }).pending.length, 0);
  assert.equal(partitionPosts([post], { ids: new Map(), urls: new Map([[post.aliases[0], "commit"]]) }).skipped[0].commit, "commit");
});

test("publishes all files atomically with a non-forced ref update", async () => {
  const calls = [];
  const result = await publishPosts({ posts: [post], release, branch: "master", snapshot: async () => state(), request: async (method, route, body) => { calls.push({ method, route, body }); return { sha: route === "git/commits" ? "new-commit" : "object" }; } });
  assert.equal(result.published[0].commit, "new-commit");
  assert.equal(calls.filter((call) => call.route === "git/trees")[0].body.tree.length, 2);
  assert.deepEqual(calls.at(-1), { method: "PATCH", route: "git/refs/heads/master", body: { sha: "new-commit", force: false } });
});

test("reconciles races and a successful write whose response was lost", async () => {
  let reads = 0;
  let updates = 0;
  const snapshot = async () => { const current = state(); if (reads++ > 0) current.submitted.ids.set("abc", "submitted"); return current; };
  const result = await publishPosts({ posts: [post], release, branch: "master", snapshot, request: async (_, route) => { if (route.startsWith("git/refs")) { updates++; throw new TypeError("Connection lost"); } return { sha: "object" }; } });
  assert.equal(updates, 1);
  assert.equal(result.skipped[0].commit, "submitted");
});

test("retries advancing target branches without overwriting and rejects permissions/collisions", async () => {
  let reads = 0;
  let updates = 0;
  const request = async (_, route) => { if (route.startsWith("git/refs") && updates++ === 0) throw Object.assign(new Error("Race"), { status: 422 }); return { sha: "object" }; };
  await publishPosts({ posts: [post], release, branch: "master", snapshot: async () => { reads++; return state(); }, request });
  assert.equal(reads, 2);
  await assert.rejects(publishPosts({ posts: [post], release, branch: "master", snapshot: async () => state(), request: async () => { throw Object.assign(new Error("Denied"), { status: 403 }); } }), /Denied/);
  const collision = state(); collision.paths.add(post.files[0].path);
  await assert.rejects(publishPosts({ posts: [post], release, branch: "master", snapshot: async () => collision, request: async () => assert.fail("Must not write") }), /already exists/);
});

test("deployment monitoring checks exact commit, branch, event and result", async () => {
  const result = await waitForDeployment({ commit: "target", workflow: "ci-cd.yml", branch: "master", request: async () => ({ workflow_runs: [
    { id: 2, head_sha: "other", status: "completed", conclusion: "success", head_branch: "master", event: "push" },
    { id: 1, head_sha: "target", status: "completed", conclusion: "failure", head_branch: "master", event: "push", html_url: "https://github.com/run" },
  ] }) });
  assert.equal(result.success, false);
  assert.equal(result.conclusion, "failure");
  let time = 0;
  const timeout = await waitForDeployment({ commit: "target", workflow: "ci-cd.yml", branch: "master", deadlineMs: 20, now: () => time, sleep: async (ms) => { time += ms; }, request: async () => ({ workflow_runs: [] }) });
  assert.equal(timeout.conclusion, "timed_out");
});

test("API failures do not expose token or submitted content", async () => {
  const request = githubClient({ token: "private-token", repository: "owner/repo", fetchImpl: async () => ({ ok: false, status: 401 }) });
  await assert.rejects(request("POST", "git/blobs", { content: "private-content" }), (error) => !error.message.includes("private-token") && !error.message.includes("private-content"));
});

test("uses the supplied personal access token for publication and deployment requests", async () => {
  const calls = [];
  const request = githubClient({ token: "personal-token", repository: "owner/repo", fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ sha: "commit" }) };
  } });
  await request("POST", "git/blobs", { content: "Body" });
  await request("GET", "actions/workflows/ci-cd.yml/runs");
  assert.equal(calls.length, 2);
  for (const call of calls) assert.equal(call.options.headers.Authorization, "Bearer personal-token");
  assert.ok(calls.every((call) => !call.url.includes("personal-token")));
});
