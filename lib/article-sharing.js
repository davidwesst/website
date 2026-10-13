import assert from "node:assert/strict";
import { validateDeployment } from "./deployment-identity.js";

export const PUBLISHING_WORKFLOW = ".github/workflows/azure-static-web-apps-gray-smoke-09b0c160f.yml";
const BUILD_JOB = "Build and test (Node 26)";
const DEPLOY_JOBS = ["Deploy to Azure during migration", "Deploy to Cloudflare"];

export function isProductionPublishingRun(run, repository) {
  return run?.repository?.full_name === repository && run?.head_repository?.full_name === repository
    && run.path === PUBLISHING_WORKFLOW && run.event === "push" && run.head_branch === "main"
    && run.status === "completed" && Number.isSafeInteger(run.id) && run.id > 0
    && Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0 && /^[a-f0-9]{40}$/.test(run.head_sha || "");
}

export function publishingJobsSucceeded(run, jobs) {
  const latest = new Map();
  for (const job of jobs) {
    assert.equal(job.run_id, run.id, "Job must belong to the publishing run");
    assert.equal(job.head_sha, run.head_sha, "Job must match the publishing commit");
    const prior = latest.get(job.name);
    if (!prior || job.id > prior.id) latest.set(job.name, job);
  }
  const succeeded = (name) => latest.get(name)?.status === "completed" && latest.get(name)?.conclusion === "success";
  return succeeded(BUILD_JOB) && DEPLOY_JOBS.some(succeeded);
}

// This runs with the source repository's read-only GITHUB_TOKEN, before the
// target publication credential is exposed to any job.
export async function selectSharingRelease({ github, context, repository }) {
  assert.equal(context.eventName, "workflow_run", "Article sharing requires a completed publishing workflow");
  const trigger = context.payload.workflow_run;
  if (context.payload.action !== "completed" || !isProductionPublishingRun(trigger, repository)) {
    return { eligible: false, reason: "Not a completed production push publication" };
  }
  const repo = context.repo;
  assert.equal(`${repo.owner}/${repo.repo}`, repository, "Unexpected source repository");
  const { data: run } = await github.rest.actions.getWorkflowRun({ ...repo, run_id: trigger.id });
  assert.equal(run.id, trigger.id, "Publishing run identity changed");
  assert.equal(run.head_sha, trigger.head_sha, "Publishing commit changed");
  if (!isProductionPublishingRun(run, repository) || run.run_attempt !== trigger.run_attempt) {
    return { eligible: false, reason: "Publishing run was superseded by another attempt" };
  }
  // All attempts are needed when only failed jobs were rerun. Select the newest
  // instance of each job, retaining successful build/deploy jobs from earlier attempts.
  const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, { ...repo, run_id: run.id, filter: "all", per_page: 100 });
  if (!publishingJobsSucceeded(run, jobs)) return { eligible: false, reason: "Build or production deployment did not succeed" };
  const artifacts = await github.paginate(github.rest.actions.listWorkflowRunArtifacts, { ...repo, run_id: run.id, per_page: 100 });
  const sites = artifacts.filter((artifact) => artifact.name === "site" && !artifact.expired);
  assert.equal(sites.length, 1, "Publishing run must have exactly one unexpired site artifact");
  const artifact = sites[0];
  assert.ok(Number.isSafeInteger(artifact.id) && artifact.id > 0, "Invalid source artifact identity");
  assert.equal(artifact.workflow_run?.id, run.id, "Site artifact must belong to the publishing run");
  assert.equal(artifact.workflow_run?.head_sha, run.head_sha, "Site artifact must match the publishing commit");
  return { eligible: true, runId: run.id, runAttempt: run.run_attempt, commit: run.head_sha, artifactId: artifact.id };
}

export function assertSharingContext(env, repository, event) {
  assert.equal(env.GITHUB_ACTIONS, "true", "Publishing requires GitHub Actions");
  assert.equal(env.GITHUB_EVENT_NAME, "workflow_run", "Publishing requires the article-sharing workflow");
  assert.equal(env.GITHUB_REPOSITORY, repository, "Unexpected source repository");
  assert.equal(env.WESTERN_DEVS_ENABLED, "true", "Crossposting must be explicitly enabled");
  assert.equal(env.SHARING_RELEASE_READY, "true", "Source publishing jobs must be verified before sharing");
  assert.ok(event?.action === "completed" && isProductionPublishingRun(event.workflow_run, repository), "Publishing requires a completed production main push run");
  return event.workflow_run;
}

export function validateSharingArtifact(release, run) {
  validateDeployment(release, run.head_sha);
  const match = release.buildId.match(new RegExp(`^github-${run.id}-(\\d+)$`));
  assert.ok(match, "Artifact build identity must belong to the source publishing run");
  const buildAttempt = Number(match[1]);
  assert.ok(Number.isSafeInteger(buildAttempt) && buildAttempt > 0 && buildAttempt <= run.run_attempt, "Artifact build attempt must precede or match the source publishing attempt");
  return release;
}
