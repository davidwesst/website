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
const context = (source = run()) => ({ eventName: "workflow_dispatch", ref: "refs/heads/main", repo: { owner: "davidwesst", repo: "website" }, payload: { inputs: { "source-run-id": String(source.id), "source-run-attempt": String(source.run_attempt), "source-sha": source.head_sha } } });
function github(source = run(), jobList = jobs(), artifacts = [site()]) {
  return {
    rest: { actions: { getWorkflowRun: async (query) => { assert.equal(query.run_id, 100); return { data: source }; }, listJobsForWorkflowRun: "jobs", listWorkflowRunArtifacts: "artifacts" } },
    paginate: async (method, query) => { assert.equal(query.run_id, 100); if (method === "jobs") { assert.equal(query.filter, "all"); return jobList; } assert.equal(method, "artifacts"); return artifacts; },
  };
}

test("sharing selects the originating artifact despite an IndexNow failure", async () => {
  const source = run({ conclusion: "failure" });
  const selected = await selectSharingRelease({ github: github(source), context: context(source), repository });
  assert.equal(selected.eligible, true);
  assert.equal(selected.runId, 100);
  assert.equal(selected.commit, sha);
  assert.equal(selected.artifactId, 200);
  assert.equal(selected.sourceRun.head_sha, sha);
});

test("sharing verifies main push provenance through the API rather than trusting dispatch inputs", async () => {
  for (const extra of [{ event: "pull_request" }, { event: "workflow_dispatch" }, { head_branch: "staging" }, { status: "queued" }, { head_repository: { full_name: "other/fork" } }, { repository: { full_name: "other/site" } }, { path: ".github/workflows/other.yml" }]) {
    const source = run(extra);
    assert.equal(isProductionPublishingRun(source, repository), false);
    const selected = await selectSharingRelease({ github: github(source), context: context(), repository });
    assert.equal(selected.eligible, false);
  }
  await assert.rejects(selectSharingRelease({ github: github(run({ head_sha: "b".repeat(40) })), context: context(), repository }), /Publishing commit/);
  await assert.rejects(selectSharingRelease({ github: github(run({ id: 101 })), context: context(), repository }), /Publishing run identity/);
});

test("sharing can start after deployment while CI/CD is still running optional jobs", async () => {
  const source = run({ status: "in_progress", conclusion: null });
  const selected = await selectSharingRelease({ github: github(source), context: context(source), repository });
  assert.equal(selected.eligible, true);
  assert.equal(selected.sourceRun.status, "in_progress");
  const blocked = await selectSharingRelease({ github: github(source, [job("Build and test (Node 26)", 1), job("Deploy to Cloudflare", 2, null, { status: "in_progress" })]), context: context(source), repository });
  assert.equal(blocked.eligible, false);
});

test("invalid dispatch identities and non-main dispatches are rejected before API reads", async () => {
  const noReads = { rest: { actions: { getWorkflowRun: () => assert.fail("Invalid dispatch must not query GitHub") } } };
  for (const [key, value] of [["source-run-id", "0"], ["source-run-id", "1.5"], ["source-run-id", "9007199254740992"], ["source-run-attempt", "-1"], ["source-run-attempt", undefined], ["source-sha", "bad"]]) {
    const dispatch = context();
    dispatch.payload.inputs[key] = value;
    await assert.rejects(selectSharingRelease({ github: noReads, context: dispatch, repository }));
  }
  for (const extra of [{ eventName: "workflow_run" }, { ref: "refs/heads/feature" }, { repo: { owner: "other", repo: "site" } }]) {
    await assert.rejects(selectSharingRelease({ github: noReads, context: { ...context(), ...extra }, repository }));
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

test("publisher context matches the verified source run to the dispatch rather than the default-branch SHA", () => {
  const env = { GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "workflow_dispatch", GITHUB_REF_NAME: "main", GITHUB_REPOSITORY: repository, GITHUB_SHA: "b".repeat(40), WESTERN_DEVS_ENABLED: "true", SHARING_RELEASE_READY: "true", SHARING_SOURCE_RUN: JSON.stringify(run()) };
  const event = context().payload;
  assert.equal(assertSharingContext(env, repository, event).head_sha, sha);
  for (const [key, value] of [["GITHUB_ACTIONS", undefined], ["GITHUB_EVENT_NAME", "push"], ["GITHUB_EVENT_NAME", "workflow_run"], ["GITHUB_REF_NAME", "feature"], ["GITHUB_REPOSITORY", "other/fork"], ["WESTERN_DEVS_ENABLED", "false"], ["SHARING_RELEASE_READY", undefined], ["SHARING_SOURCE_RUN", undefined]]) {
    assert.throws(() => assertSharingContext({ ...env, [key]: value }, repository, event));
  }
  for (const extra of [{ event: "pull_request" }, { id: 101 }, { run_attempt: 2 }, { head_sha: "b".repeat(40) }]) {
    assert.throws(() => assertSharingContext({ ...env, SHARING_SOURCE_RUN: JSON.stringify(run(extra)) }, repository, event));
  }
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
  assert.equal(sharing.on.workflow_run, undefined);
  assert.deepEqual(Object.keys(sharing.on.workflow_dispatch.inputs), ["source-run-id", "source-run-attempt", "source-sha"]);
  assert.equal(sharing.concurrency["cancel-in-progress"], false);
  const steps = sharing.jobs["western-devs"].steps;
  const download = steps.find((step) => step.uses?.startsWith("actions/download-artifact@"));
  assert.equal(download.with["artifact-ids"], "${{ needs.release.outputs.artifact-id }}");
  assert.equal(download.with["run-id"], "${{ needs.release.outputs.source-run-id }}");
  assert.equal(download.with["merge-multiple"], true);
  assert.equal(steps[0].with.ref, "${{ needs.release.outputs.source-sha }}");
  assert.equal(steps.find((step) => step.run === "pnpm crosspost:western-devs publish").env.SHARING_SOURCE_RUN, "${{ needs.release.outputs.source-run }}");
  const dispatcher = publishing.jobs["dispatch-article-sharing"];
  assert.deepEqual(dispatcher.needs, ["build", "deploy", "deploy-cloudflare"]);
  assert.equal(dispatcher["continue-on-error"], true);
  assert.equal(dispatcher.permissions.actions, "write");
  assert.equal(sharing.permissions.actions, "read");
  assert.ok(!dispatcher.if.includes("indexnow"));
  assert.ok(dispatcher.if.includes("needs.build.result == 'success'"));
  assert.ok(dispatcher.if.includes("github.ref_name == 'main'"));
  assert.ok(!JSON.stringify(dispatcher).includes("WESTERN_DEVS_TOKEN"), "Eligibility and dispatch must not need the target publication credential");
  for (const name of ["build", "deploy", "deploy-cloudflare", "indexnow"]) {
    assert.ok(!JSON.stringify(publishing.jobs[name].needs || []).includes("dispatch-article-sharing"), "Publishing must not depend on dispatch");
  }
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
    if (deploymentSucceeded) {
      const { ["source-run"]: identity, ...rest } = outputs;
      assert.deepEqual(rest, { eligible: "true", "source-sha": sha, "source-run-id": "100", "artifact-id": "200" });
      assert.equal(JSON.parse(identity).head_sha, sha);
    }
    else assert.deepEqual(outputs, { eligible: "false" });
  }
});

test("the actual CI/CD dispatcher creates sharing runs only for pending articles and passes the source identity", async () => {
  const workflow = matter.engines.yaml.parse(await readFile(PUBLISHING_WORKFLOW, "utf8"));
  const dispatch = workflow.jobs["dispatch-article-sharing"].steps.find((step) => step.uses?.startsWith("actions/github-script@"));
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const execute = new AsyncFunction("github", "context", "core", "process", dispatch.with.script);
  for (const count of ["0", "", "bad", "-1", "2"]) {
    const requests = [];
    const summary = { addHeading() { return this; }, addRaw() { return this; }, async write() {} };
    await execute({ rest: { actions: { createWorkflowDispatch: async (query) => requests.push(query) } } },
      { repo: context().repo, runId: 100, sha }, { summary }, { env: { PENDING_ARTICLES: count, GITHUB_RUN_ATTEMPT: "2" } });
    if (count === "2") assert.deepEqual(requests, [{ ...context().repo, workflow_id: "article-sharing.yml", ref: "main", inputs: { "source-run-id": "100", "source-run-attempt": "2", "source-sha": sha } }]);
    else assert.equal(requests.length, 0);
  }
});

test("the dispatcher runs only after enabled main push publication and does not depend on IndexNow", async () => {
  const workflow = matter.engines.yaml.parse(await readFile(PUBLISHING_WORKFLOW, "utf8"));
  const condition = workflow.jobs["dispatch-article-sharing"].if.replace(/\bneeds\.([\w-]+)\./g, 'needs["$1"].');
  const eligible = new Function("vars", "github", "needs", "always", `return (${condition});`);
  const base = { build: { result: "success" }, deploy: { result: "skipped" }, "deploy-cloudflare": { result: "success" }, indexnow: { result: "failure" } };
  const check = (vars = { WESTERN_DEVS_ENABLED: "true" }, event = { event_name: "push", ref_name: "main" }, changes = {}) => eligible(vars, event, { ...base, ...changes }, () => true);
  assert.equal(check(), true);
  assert.equal(check(undefined, undefined, { deploy: { result: "success" }, "deploy-cloudflare": { result: "skipped" } }), true);
  assert.equal(check({ WESTERN_DEVS_ENABLED: "false" }), false);
  assert.equal(check(undefined, { event_name: "pull_request", ref_name: "main" }), false);
  assert.equal(check(undefined, { event_name: "push", ref_name: "feature" }), false);
  assert.equal(check(undefined, undefined, { build: { result: "failure" } }), false);
  assert.equal(check(undefined, undefined, { "deploy-cloudflare": { result: "failure" } }), false);
});
