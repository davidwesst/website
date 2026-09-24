import assert from "node:assert/strict";
import test from "node:test";
import { resolveBranchName, telemetryBuildConfig } from "../lib/telemetry-build.js";
import { SIMPLE_ANALYTICS_SHA256, SIMPLE_ANALYTICS_SOURCE, SIMPLE_ANALYTICS_VERSION, verifySimpleAnalyticsSource } from "../tools/prepare-telemetry.mjs";

test("branch resolution prefers GitHub and falls back to Git", () => {
  assert.equal(resolveBranchName({ githubRefName: "main", readCurrentBranch: () => "ignored" }), "main");
  assert.equal(resolveBranchName({ githubRefName: "", readCurrentBranch: () => "ft/example\n" }), "ft/example");
});

test("only main builds enable Simple Analytics, without Azure credentials", () => {
  assert.deepEqual(telemetryBuildConfig({ branchName: "main", runMode: "build" }), { branchName: "main", enabled: true });
  for (const branchName of ["ft/cloudflare-migration", "123/merge", "", "staging"]) {
    assert.equal(telemetryBuildConfig({ branchName, runMode: "build" }).enabled, false);
  }
});

test("development serving disables analytics even on main", () => {
  assert.equal(telemetryBuildConfig({ branchName: "main", runMode: "serve" }).enabled, false);
});

test("Simple Analytics uses an immutable, integrity-checked upstream asset", () => {
  assert.match(SIMPLE_ANALYTICS_VERSION, /^[0-9a-f]{40}$/);
  assert.match(SIMPLE_ANALYTICS_SHA256, /^[0-9a-f]{64}$/);
  assert.ok(SIMPLE_ANALYTICS_SOURCE.includes(SIMPLE_ANALYTICS_VERSION));
  assert.throws(() => verifySimpleAnalyticsSource("modified script"), /failed integrity verification/);
});
