import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import matter from "gray-matter";
import path from "node:path";
import { createRequire } from "node:module";
import { assertSharingContext, isProductionPublishingRun, publishingJobsSucceeded, selectSharingRelease, validateSharingArtifact, PUBLISHING_WORKFLOW } from "../lib/article-sharing.js";

const repository = "davidwesst/website";
const sha = "a".repeat(40);
const run = (extra = {}) => ({ id: 100, run_attempt: 1, head_sha: sha, head_branch: "main", event: "push", status: "completed", conclusion: "success", path: PUBLISHING_WORKFLOW, repository: { full_name: repository }, head_repository: { full_name: repository }, ...extra });
const job = (name, id, conclusion = "success", extra = {}) => ({ name, id, run_id: 100, head_sha: sha, status: "completed", conclusion, ...extra });
const jobs = () => [job("Build and test (Node 26)", 1), job("Deploy to Cloudflare", 2), job("Deploy to Azure during migration", 3, "skipped"), job("Notify IndexNow after verified production deployment", 4, "failure")];
const site = (extra = {}) => ({ name: "site", id: 200, expired: false, workflow_run: { id: 100, head_sha: sha }, ...extra });
const context = (source = run()) => ({ eventName: "workflow_run", repo: { owner: "davidwesst", repo: "website" }, payload: { action: "completed", workflow_run: source } });
function github(source = run(), jobList = jobs(), artifacts = [site()]) {
  return {
    rest: { actions: { getWorkflowRun: async (query) => { assert.equal(query.run_id, 100); return { data: source }; }, listJobsForWorkflowRun: "jobs", listWorkflowRunArtifacts: "artifacts" } },
    paginate: async (method, query) => { assert.equal(query.run_id, 100); if (method === "jobs") { assert.equal(query.filter, "all"); return jobList; } assert.equal(method, "artifacts"); return artifacts; },
  };
}

test("sharing selects the originating artifact despite an IndexNow failure", async () => {
  const source = run({ conclusion: "failure" });
  const selected = await selectSharingRelease({ github: github(source), context: context(source), repository });
  assert.deepEqual(selected, { eligible: true, runId: 100, runAttempt: 1, commit: sha, artifactId: 200 });
});

test("sharing requires a completed main push in the source repository and expected workflow", async () => {
  for (const extra of [{ event: "pull_request" }, { event: "workflow_dispatch" }, { head_branch: "staging" }, { status: "in_progress" }, { head_repository: { full_name: "other/fork" } }, { repository: { full_name: "other/site" } }, { path: ".github/workflows/other.yml" }, { head_sha: "bad" }]) {
    const source = run(extra);
    assert.equal(isProductionPublishingRun(source, repository), false);
    const selected = await selectSharingRelease({ github: { rest: { actions: { getWorkflowRun: () => assert.fail("Untrusted source must not be queried") } } }, context: context(source), repository });
    assert.equal(selected.eligible, false);
  }
});

test("failed or skipped builds and deployments never authorize sharing", () => {
  for (const conclusion of ["failure", "cancelled", "skipped"]) {
    assert.equal(publishingJobsSucceeded(run(), [job("Build and test (Node 26)", 1, conclusion), job("Deploy to Cloudflare", 2)]), false);
    assert.equal(publishingJobsSucceeded(run(), [job("Build and test (Node 26)", 1), job("Deploy to Cloudflare", 2, conclusion)]), false);
  }
  assert.equal(publishingJobsSucceeded(run(), [job("Build and test (Node 26)", 1), job("Deploy to Azure during migration", 2)]), true);
  assert.throws(() => publishingJobsSucceeded(run(), [job("Build and test (Node 26)", 1, "success", { head_sha: "b".repeat(40) })]), /publishing commit/);
});

test("failed-job reruns retain successful source jobs and use the newest result of rerun jobs", async () => {
  const source = run({ run_attempt: 2, conclusion: "failure" });
  const selected = await selectSharingRelease({ github: github(source, [...jobs(), job("Notify IndexNow after verified production deployment", 5, "failure")]), context: context(source), repository });
  assert.equal(selected.eligible, true);
  assert.equal(selected.runAttempt, 2);
  assert.equal(publishingJobsSucceeded(source, [...jobs(), job("Deploy to Cloudflare", 6, "failure")]), false);
  const changed = await selectSharingRelease({ github: github(run({ run_attempt: 3 })), context: context(source), repository });
  assert.equal(changed.eligible, false);
});

test("expired, missing, ambiguous, or mismatched source artifacts fail explicitly", async () => {
  for (const artifacts of [[], [site({ expired: true })], [site(), site({ id: 201 })], [site({ workflow_run: { id: 101, head_sha: sha } })], [site({ workflow_run: { id: 100, head_sha: "b".repeat(40) } })]]) {
    await assert.rejects(selectSharingRelease({ github: github(run(), jobs(), artifacts), context: context(), repository }), /artifact/);
  }
});

test("publisher context uses the verified source run rather than the sharing workflow's default-branch SHA", () => {
  const env = { GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "workflow_run", GITHUB_REPOSITORY: repository, GITHUB_SHA: "b".repeat(40), WESTERN_DEVS_ENABLED: "true", SHARING_RELEASE_READY: "true" };
  const event = context().payload;
  assert.equal(assertSharingContext(env, repository, event).head_sha, sha);
  for (const [key, value] of [["GITHUB_ACTIONS", undefined], ["GITHUB_EVENT_NAME", "push"], ["GITHUB_EVENT_NAME", "workflow_dispatch"], ["GITHUB_REPOSITORY", "other/fork"], ["WESTERN_DEVS_ENABLED", "false"], ["SHARING_RELEASE_READY", undefined]]) {
    assert.throws(() => assertSharingContext({ ...env, [key]: value }, repository, event));
  }
  assert.throws(() => assertSharingContext(env, repository, context(run({ event: "pull_request" })).payload));
});

test("source artifact build identity remains intact on deployment-only or sharing reruns", () => {
  const source = run({ run_attempt: 3 });
  const artifact = { schemaVersion: 1, commit: sha, buildId: "github-100-1" };
  assert.deepEqual(validateSharingArtifact(artifact, source), artifact);
  for (const buildId of ["github-101-1", "github-100-4", "github-100-0", "local-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]) {
    assert.throws(() => validateSharingArtifact({ ...artifact, buildId }, source));
  }
  assert.throws(() => validateSharingArtifact({ ...artifact, commit: "b".repeat(40) }, source), /workflow commit/);
});

test("article-sharing is separate from CI/CD and downloads an explicit source artifact", async () => {
  const publishing = matter.engines.yaml.parse(await readFile(PUBLISHING_WORKFLOW, "utf8"));
  const sharing = matter.engines.yaml.parse(await readFile(".github/workflows/article-sharing.yml", "utf8"));
  assert.equal(sharing.name, "article-sharing");
  assert.equal(publishing.jobs["western-devs"], undefined);
  assert.equal(publishingJobsSucceeded(run(), [job(publishing.jobs.build.name, 1), job(publishing.jobs["deploy-cloudflare"].name, 2)]), true, "Release selectors must match the actual publishing job names");
  assert.deepEqual(sharing.on.workflow_run, { workflows: ["CI/CD"], types: ["completed"], branches: ["main"] });
  assert.equal(sharing.concurrency["cancel-in-progress"], false);
  const steps = sharing.jobs["western-devs"].steps;
  const download = steps.find((step) => step.uses?.startsWith("actions/download-artifact@"));
  assert.equal(download.with["artifact-ids"], "${{ needs.release.outputs.artifact-id }}");
  assert.equal(download.with["run-id"], "${{ needs.release.outputs.source-run-id }}");
  assert.equal(download.with["merge-multiple"], true);
  assert.equal(steps[0].with.ref, "${{ needs.release.outputs.source-sha }}");
});

test("the actual workflow gate exports only the selected source artifact and commit", async () => {
  const workflow = matter.engines.yaml.parse(await readFile(".github/workflows/article-sharing.yml", "utf8"));
  const script = workflow.jobs.release.steps.find((step) => step.id === "release").with.script;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const execute = new AsyncFunction("github", "context", "core", "process", "require", script);
  const require = createRequire(import.meta.url);
  for (const deploymentSucceeded of [true, false]) {
    const outputs = {};
    const summary = { addHeading() { return this; }, addRaw() { return this; }, async write() {} };
    const source = run({ conclusion: "failure" });
    await execute(github(source, deploymentSucceeded ? jobs() : []), context(source), { setOutput: (name, value) => { outputs[name] = value; }, summary }, { env: { GITHUB_WORKSPACE: path.resolve(".") } }, require);
    assert.equal(outputs.eligible, String(deploymentSucceeded));
    if (deploymentSucceeded) assert.deepEqual(outputs, { eligible: "true", "source-sha": sha, "source-run-id": "100", "artifact-id": "200" });
    else assert.deepEqual(outputs, { eligible: "false" });
  }
});
