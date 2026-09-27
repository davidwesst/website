import assert from "node:assert/strict";
import test from "node:test";
import {
  APPLICATION_INSIGHTS_CONNECTION_STRING,
  APPLICATION_INSIGHTS_EXCLUDED_REQUESTS,
  applicationInsightsConfig,
  isDoNotTrackEnabled,
} from "../lib/application-insights-config.js";
import { resolveBranchName, telemetryBuildConfig } from "../lib/telemetry-build.js";
import { SIMPLE_ANALYTICS_SHA256, SIMPLE_ANALYTICS_SOURCE, SIMPLE_ANALYTICS_VERSION, verifySimpleAnalyticsSource } from "../tools/prepare-telemetry.mjs";

test("branch resolution prefers GitHub and falls back to Git", () => {
  assert.equal(resolveBranchName({ githubRefName: "main", readCurrentBranch: () => "ignored" }), "main");
  assert.equal(resolveBranchName({ githubRefName: "", readCurrentBranch: () => "ft/example\n" }), "ft/example");
});

test("only main builds enable browser telemetry, without Azure credentials", () => {
  assert.deepEqual(telemetryBuildConfig({ branchName: "main", runMode: "build" }), { branchName: "main", enabled: true });
  for (const branchName of ["ft/cloudflare-migration", "123/merge", "", "staging"]) {
    assert.equal(telemetryBuildConfig({ branchName, runMode: "build" }).enabled, false);
  }
});

test("development serving disables telemetry even on main", () => {
  assert.equal(telemetryBuildConfig({ branchName: "main", runMode: "serve" }).enabled, false);
});

test("Simple Analytics uses an immutable, integrity-checked upstream asset", () => {
  assert.match(SIMPLE_ANALYTICS_VERSION, /^[0-9a-f]{40}$/);
  assert.match(SIMPLE_ANALYTICS_SHA256, /^[0-9a-f]{64}$/);
  assert.ok(SIMPLE_ANALYTICS_SOURCE.includes(SIMPLE_ANALYTICS_VERSION));
  assert.throws(() => verifySimpleAnalyticsSource("modified script"), /failed integrity verification/);
});

test("Application Insights targets the production resource with privacy-first defaults", () => {
  const tracingMode = Symbol("W3C");
  const config = applicationInsightsConfig(tracingMode);
  assert.match(APPLICATION_INSIGHTS_CONNECTION_STRING, /InstrumentationKey=02bb1e7e-9076-443c-ad13-258266606aa0/);
  assert.match(APPLICATION_INSIGHTS_CONNECTION_STRING, /IngestionEndpoint=https:\/\/canadaeast-0\.in\.applicationinsights\.azure\.com\//);
  assert.equal(config.connectionString, APPLICATION_INSIGHTS_CONNECTION_STRING);
  assert.equal(config.distributedTracingMode, tracingMode);
  assert.equal(config.disableExceptionTracking, false);
  assert.equal(config.enableUnhandledPromiseRejectionTracking, true);
  assert.equal(config.disableAjaxTracking, false);
  assert.equal(config.disableFetchTracking, false);
  assert.equal(config.enableAjaxPerfTracking, true);
  assert.equal(config.disableCorrelationHeaders, false);
  assert.equal(config.enableCorsCorrelation, false);
  assert.equal(config.samplingPercentage, 100);
  assert.deepEqual(config.cookieCfg, { enabled: false });
  for (const setting of [
    "autoTrackPageVisitTime",
    "disableCookiesUsage",
    "isStorageUseDisabled",
    "enableSessionStorageBuffer",
    "enableAutoRouteTracking",
    "enableRequestHeaderTracking",
    "enableResponseHeaderTracking",
    "enableAjaxErrorStatusText",
  ]) assert.equal(config[setting], setting.startsWith("disable") || setting === "isStorageUseDisabled");
  assert.ok(APPLICATION_INSIGHTS_EXCLUDED_REQUESTS.some((pattern) => pattern.test("https://queue.simpleanalyticscdn.com/events")));
  assert.ok(APPLICATION_INSIGHTS_EXCLUDED_REQUESTS.some((pattern) => pattern.test("https://canadaeast-0.in.applicationinsights.azure.com/v2/track")));
});

test("Application Insights honors common Do Not Track values", () => {
  assert.equal(isDoNotTrackEnabled(), false);
  assert.equal(isDoNotTrackEnabled({ navigator: "0" }), false);
  assert.equal(isDoNotTrackEnabled({ navigator: "1" }), true);
  assert.equal(isDoNotTrackEnabled({ window: "1" }), true);
  assert.equal(isDoNotTrackEnabled({ microsoft: "yes" }), true);
});
