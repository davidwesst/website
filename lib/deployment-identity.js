import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

export function validateDeployment(value, expectedCommit) {
  assert.ok(value && value.schemaVersion === 1, "Invalid deployment schema version");
  assert.ok(typeof value.commit === "string" && /^[a-f0-9]{40}$/.test(value.commit), "Invalid deployment commit");
  assert.ok(typeof value.buildId === "string" && /^(github-\d+-\d+|local-[a-f0-9-]{36})$/.test(value.buildId), "Invalid deployment build identity");
  if (expectedCommit) assert.equal(value.commit, expectedCommit, "Artifact commit must match workflow commit");
  return { schemaVersion: value.schemaVersion, commit: value.commit, buildId: value.buildId };
}

export function createDeployment({ env = process.env, gitCommit = () => execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), uuid = randomUUID } = {}) {
  const ci = env.GITHUB_ACTIONS === "true";
  if (ci) {
    assert.match(env.GITHUB_RUN_ID || "", /^\d+$/, "Missing GitHub run ID");
    assert.match(env.GITHUB_RUN_ATTEMPT || "", /^\d+$/, "Missing GitHub run attempt");
    assert.ok(env.GITHUB_SHA, "Missing GitHub commit");
  }
  return validateDeployment({ schemaVersion: 1, commit: ci ? env.GITHUB_SHA : gitCommit(), buildId: ci ? `github-${env.GITHUB_RUN_ID}-${env.GITHUB_RUN_ATTEMPT}` : `local-${uuid()}` });
}

export async function readDeployment(file = "_site/deployment.json", expectedCommit = process.env.GITHUB_SHA) {
  // The artifact, not the current run attempt, owns the build identity on deploy-only reruns.
  return validateDeployment(JSON.parse(await readFile(file, "utf8")), expectedCommit);
}
