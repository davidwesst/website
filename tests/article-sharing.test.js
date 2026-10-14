import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, readFile, writeFile, rm, utimes } from "node:fs/promises";
import matter from "gray-matter";
import { shareArticle } from "../lib/article-sharing.js";
import { parseSharingArgs } from "../tools/share-article.mjs";

const origin = "https://david.wes.st";
const cli = path.resolve("tools/share-article.mjs");
const run = promisify(execFile);
const sourceFile = "src/content/posts/articles/example/index.md";
const config = {
  sourceRepository: "owner/source",
  destinations: { wd: { name: "Western Devs", adapter: "western-devs", repository: "owner/target",
    branch: "master", workflow: "deploy.yml", authorId: "configured_author", tokenEnv: "TEST_SHARING_TOKEN" } },
};
async function put(root, file, bytes) {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), bytes);
}
async function fixture(t, configuration = config) {
  const root = await mkdtemp(path.join(os.tmpdir(), "manual-sharing-"));
  t.after(async () => {
    assert.ok(path.resolve(root).startsWith(`${path.resolve(os.tmpdir())}${path.sep}`));
    await rm(root, { recursive: true, force: true });
  });
  await put(root, "config/sharing.json", JSON.stringify(configuration));
  await put(root, sourceFile, "---\ntitle: Selected article\ndate: 2026-10-13\ntopics: [devlog]\n---\nLocal content\n");
  await put(root, "src/content/posts/articles/example/image.png", Buffer.from([1, 2, 3]));
  await put(root, "src/content/posts/articles/another/index.md", "---\ntitle: Another article\n---\nOther content\n");
  await put(root, "_site/blog/example/image.png", Buffer.from([1, 2, 3]));
  await put(root, "_site/blog/example/index.html", `<link rel="canonical" href="${origin}/blog/example/"><meta name="description" content="Description"><article><section aria-label="Post content"><p>Selected body</p><img src="./image.png" alt="Image"></section></article>`);
  await put(root, "_site/deployment.json", JSON.stringify({ schemaVersion: 1, commit: "a".repeat(40), buildId: "local-11111111-1111-4111-8111-111111111111" }));
  return root;
}
const state = (ids = new Map(), urls = new Map()) => ({ commit: "target", tree: "tree", paths: new Set(), submitted: { ids, urls } });
const noRequest = async () => assert.fail("Preview must not contact GitHub");

test("CLI arguments require a slug and configured destination, with explicit publication and optional waiting", () => {
  assert.deepEqual(parseSharingArgs(["example", "wd"]), { slug: "example", destination: "wd", publish: false, wait: false });
  assert.deepEqual(parseSharingArgs(["--", "example", "wd", "--publish", "--wait"]), { slug: "example", destination: "wd", publish: true, wait: true });
  for (const args of [[], ["example"], ["example", "wd", "extra"], ["example", "wd", "--unknown"], ["example", "wd", "--wait"]]) assert.throws(() => parseSharingArgs(args));
  assert.equal(parseSharingArgs(["--help"]).help, true);
});

test("previews select only the requested article, use destination configuration, and preserve earlier experiments", async (t) => {
  const root = await fixture(t);
  const options = { root, origin, env: {}, request: noRequest, snapshot: noRequest };
  const first = await shareArticle("example", "wd", options);
  assert.equal(first.status, "prepared");
  assert.equal(first.mode, "preview");
  assert.equal(first.files.length, 2);
  const post = await readFile(path.join(first.previewRoot, first.files[0].path), "utf8");
  assert.equal(matter(post).data.authorId, "configured_author");
  assert.equal(matter(post).data.originalurl, `${origin}/blog/example/`);
  assert.match(post, /Selected body/);
  assert.doesNotMatch(post, /Other content/);
  const second = await shareArticle("example", "wd", options);
  assert.notEqual(second.previewRoot, first.previewRoot);
  assert.equal(await readFile(path.join(first.previewRoot, first.files[0].path), "utf8"), post);
  assert.equal(JSON.parse(await readFile(first.reportPath, "utf8")).status, "prepared");
});

test("the actual CLI prepares an uncommitted article without Git history, credentials, or Actions context", async (t) => {
  const root = await fixture(t);
  const result = await run(process.execPath, [cli, "example", "wd"], { cwd: root, env: { ...process.env, GITHUB_ACTIONS: "false", TEST_SHARING_TOKEN: "" } });
  assert.match(result.stdout, /Prepared example for Western Devs/);
  assert.match(result.stdout, /Preview:/);
  assert.equal(result.stderr, "");
});

test("invalid slugs, missing articles, non-articles, and unknown destinations fail clearly", async (t) => {
  const root = await fixture(t);
  for (const family of ["posts/gamelogs", "posts/dungeonlogs", "talks", "pages"]) {
    const slug = family.replaceAll("/", "-");
    await put(root, `src/content/${family}/${slug}/index.md`, "Content\n");
    await assert.rejects(shareArticle(slug, "wd", { root, origin }), /Only articles/);
  }
  for (const slug of ["../example", "/example", "https://example.invalid/blog/example/"]) await assert.rejects(shareArticle(slug, "wd", { root, origin }), /Use an article slug/);
  await assert.rejects(shareArticle("missing", "wd", { root, origin }), /Article not found/);
  await assert.rejects(shareArticle("example", "unknown", { root, origin }), /Unknown sharing destination.*wd/);
  await assert.rejects(shareArticle("example", "../wd", { root, origin }), /configured destination/);
});

test("destination aliases and adapter validation come from repository configuration", async (t) => {
  const alternative = { ...config, destinations: { community: { ...config.destinations.wd, name: "Community preview", authorId: "other_author" } } };
  const root = await fixture(t, alternative);
  const result = await shareArticle("example", "community", { root, origin });
  assert.equal(result.destinationName, "Community preview");
  assert.equal(matter(await readFile(path.join(result.previewRoot, result.files[0].path), "utf8")).data.authorId, "other_author");
  await put(root, "config/sharing.json", JSON.stringify({ ...alternative, destinations: { community: { ...alternative.destinations.community, adapter: "missing" } } }));
  await assert.rejects(shareArticle("example", "community", { root, origin }), /Unsupported sharing adapter/);
});

test("missing builds and source or asset edits newer than the built page require a rebuild", async (t) => {
  for (const file of [sourceFile, "src/content/posts/articles/example/image.png"]) {
    const root = await fixture(t);
    const future = new Date(Date.now() + 60000);
    await utimes(path.join(root, file), future, future);
    await assert.rejects(shareArticle("example", "wd", { root, origin }), /Run pnpm build/);
  }
  const root = await fixture(t);
  await rm(path.join(root, "_site/deployment.json"));
  await assert.rejects(shareArticle("example", "wd", { root, origin }), /Run pnpm build/);
});

test("publication requires the configured environment token before any target request", async (t) => {
  const root = await fixture(t);
  await assert.rejects(shareArticle("example", "wd", { root, origin, publish: true, env: {}, request: noRequest, snapshot: noRequest }), /Set TEST_SHARING_TOKEN/);
  await assert.rejects(run(process.execPath, [cli, "example", "wd", "--publish"], { cwd: root, env: { ...process.env, TEST_SHARING_TOKEN: "" } }), (error) => error.code === 1 && /Set TEST_SHARING_TOKEN/.test(error.stderr));
});

test("explicit publication submits only the selected article in a non-forced commit", async (t) => {
  const root = await fixture(t);
  const calls = [];
  const result = await shareArticle("example", "wd", { root, origin, publish: true, env: { TEST_SHARING_TOKEN: "private-token" }, snapshot: async () => state(), request: async (method, route, body) => {
    calls.push({ method, route, body }); return { sha: route === "git/commits" ? "shared" : "object" };
  } });
  assert.equal(result.status, "published");
  assert.equal(result.published.length, 1);
  assert.equal(calls.filter((call) => call.route === "git/trees")[0].body.tree.length, 2);
  assert.deepEqual(calls.at(-1), { method: "PATCH", route: "git/refs/heads/master", body: { sha: "shared", force: false } });
  assert.doesNotMatch(await readFile(result.reportPath, "utf8"), /private-token/);
});

test("existing original-URL submissions skip conversion and all external writes, including source edits", async (t) => {
  const root = await fixture(t);
  await rm(path.join(root, "_site/deployment.json"));
  const result = await shareArticle("example", "wd", { root, origin, publish: true, env: { TEST_SHARING_TOKEN: "token" }, request: noRequest,
    snapshot: async () => state(new Map(), new Map([[`${origin}/blog/example/`, "existing"]])) });
  assert.equal(result.status, "already_shared");
  assert.equal(result.skipped[0].commit, "existing");
  assert.equal(result.files.length, 0);
});

test("failed target deployment preserves the submitted commit and saved report for recovery", async (t) => {
  const root = await fixture(t);
  const options = { root, origin, publish: true, wait: true, env: { TEST_SHARING_TOKEN: "token" }, snapshot: async () => state(), request: async (method, route) => {
    if (method === "GET") {
      assert.ok(route.startsWith("actions/workflows/deploy.yml/runs?head_sha=shared"));
      return { workflow_runs: [{ id: 1, head_sha: "shared", event: "push", head_branch: "master", status: "completed", conclusion: "failure", html_url: "https://github.com/run" }] };
    }
    return { sha: route === "git/commits" ? "shared" : "object" };
  } };
  let failure;
  await assert.rejects(shareArticle("example", "wd", options), (error) => {
    assert.match(error.message, /already submitted/);
    failure = error;
    return true;
  });
  const report = JSON.parse(await readFile(failure.reportPath, "utf8"));
  assert.equal(report.published[0].commit, "shared");
  assert.equal(report.deployments[0].conclusion, "failure");
});
