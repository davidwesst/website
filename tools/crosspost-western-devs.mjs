import assert from "node:assert/strict";
import path from "node:path";
import { readFile, mkdir, writeFile, appendFile } from "node:fs/promises";
import config from "../config/western-devs.json" with { type: "json" };
import site from "../src/_data/site.js";
import { readDeployment } from "../lib/deployment-identity.js";
import { git, discoverNewArticles, submittedCrossposts } from "../lib/crosspost-history.js";
import { convertWesternDevsPost, describeWesternDevsPost } from "../lib/western-devs-post.js";
import { assertPublishContext, githubClient, partitionPosts, publishPosts, waitForDeployment } from "../lib/crosspost-publisher.js";

const command = process.argv[2];
assert.ok(["plan", "publish"].includes(command), "Usage: node tools/crosspost-western-devs.mjs plan|publish");
const root = process.cwd();
const siteRoot = path.join(root, "_site");
const output = path.join(root, ".cache", "western-devs");
const release = await readDeployment(path.join(siteRoot, "deployment.json"));
assert.equal(git(root, ["rev-parse", "HEAD"]).trim(), release.commit, "Checkout must match the deployed artifact");
const candidates = discoverNewArticles({ root, activationCommit: config.activationCommit, commit: release.commit, repository: config.sourceRepository });
const report = { release, eligible: candidates.map(({ file, id }) => ({ file, id })), published: [], skipped: [], deployments: [], failures: [] };
await mkdir(output, { recursive: true });
try {
  let request;
  let snapshot;
  let pendingCandidates = candidates;
  const targetRoot = path.join(root, ".cache", "western-devs-target");
  if (command === "publish") {
    assertPublishContext(process.env, config.sourceRepository);
    // Verify the full release again in the publisher, even if the workflow step
    // was bypassed or the site advanced between steps.
    // The established CLI owns readiness and all redirect assertions.
    const { execFileSync } = await import("node:child_process");
    execFileSync(process.execPath, ["tools/check-hosting.mjs", site.url, "--all-redirects", "--wait-for-release"], { cwd: root, stdio: "inherit", env: { ...process.env, EXPECT_TELEMETRY: "true" } });
    request = githubClient({ token: process.env.WESTERN_DEVS_TOKEN, repository: config.targetRepository });
    snapshot = async () => {
      git(targetRoot, ["fetch", "origin", config.targetBranch]);
      const commit = git(targetRoot, ["rev-parse", "FETCH_HEAD"]).trim();
      return { commit, tree: git(targetRoot, ["rev-parse", `${commit}^{tree}`]).trim(),
        paths: new Set(git(targetRoot, ["ls-tree", "-r", "--name-only", commit]).trim().split("\n")),
        submitted: submittedCrossposts(targetRoot, commit) };
    };
    const descriptions = [];
    for (const candidate of candidates) descriptions.push({ ...candidate, ...describeWesternDevsPost({ source: await readFile(path.join(root, candidate.file), "utf8"), candidate, origin: site.url }) });
    const partition = partitionPosts(descriptions, (await snapshot()).submitted);
    report.skipped = partition.skipped;
    pendingCandidates = partition.pending;
  }
  const posts = [];
  for (const candidate of pendingCandidates) {
    try {
      posts.push(await convertWesternDevsPost({ root, siteRoot, origin: site.url, candidate, release }));
    } catch (error) {
      report.failures.push({ file: candidate.file, message: error.message });
    }
  }
  assert.equal(report.failures.length, 0, "Crosspost conversion failed; see the report. No articles were submitted.");
  if (command === "plan") {
    for (const post of posts) for (const file of post.files) {
      const destination = path.join(output, "preview", file.path);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, file.bytes);
    }
    console.log(`Prepared ${posts.length} eligible article(s) for local review.`);
  } else {
    if (posts.length) {
      const result = await publishPosts({ posts, release, branch: config.targetBranch, request, snapshot });
      report.published = result.published;
      report.skipped.push(...result.skipped);
    }
    for (const commit of new Set([...report.published, ...report.skipped].map((post) => post.commit))) {
      // Historical/manual matches need no deployment retry; automated commits do.
      if (!report.published.some((post) => post.commit === commit) && !git(targetRoot, ["log", "-1", "--format=%B", commit]).includes("verified source release")) continue;
      const deployment = await waitForDeployment({ request, commit, branch: config.targetBranch, workflow: config.targetWorkflow, onProgress: console.log });
      report.deployments.push(deployment);
    }
    assert.ok(report.deployments.every((deployment) => deployment.success), "Target deployment failed or timed out; retry the existing target run. Articles are already submitted.");
  }
} catch (error) {
  report.failures.push({ message: error.message });
  process.exitCode = 1;
  console.error(error.message);
} finally {
  await writeFile(path.join(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  const lines = ["## Western Devs crossposting", `Source release: ${release.commit} (${release.buildId})`,
    `Eligible: ${report.eligible.length}; submitted: ${report.published.length}; previously submitted: ${report.skipped.length}.`,
    ...report.published.map((post) => `- Published identity ${post.id}: https://github.com/${config.targetRepository}/commit/${post.commit}`),
    ...report.skipped.map((post) => `- Previously submitted identity ${post.id}: https://github.com/${config.targetRepository}/commit/${post.commit}`),
    ...report.deployments.map((deployment) => `- Target deployment: ${deployment.conclusion}${deployment.url ? ` (${deployment.url})` : ""}`),
    ...report.failures.map((failure) => `- Failure: ${failure.file || "publication"}: ${failure.message}`)];
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
}
