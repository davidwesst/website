import assert from "node:assert/strict";
import test from "node:test";
import {
  createApplicationInsightsConfig,
  createTelemetryInitializer,
  sanitizeTelemetryText,
  sanitizeTelemetryUrl,
} from "../src/_lib/telemetry-policy.js";
import {
  resolveBranchName,
  telemetryBuildConfig,
  validateConnectionString,
} from "../lib/telemetry-build.js";
import {
  SIMPLE_ANALYTICS_SHA256,
  SIMPLE_ANALYTICS_SOURCE,
  SIMPLE_ANALYTICS_VERSION,
  verifySimpleAnalyticsSource,
} from "../tools/prepare-telemetry.mjs";

const validConnectionString = [
  "InstrumentationKey=00000000-0000-4000-8000-000000000001",
  "IngestionEndpoint=https://canadacentral-1.in.applicationinsights.azure.com/",
].join(";");

test("branch resolution prefers GitHub and falls back to the current Git branch", () => {
  assert.equal(resolveBranchName({ githubRefName: "main", readCurrentBranch: () => "ignored" }), "main");
  assert.equal(resolveBranchName({ githubRefName: "", readCurrentBranch: () => "ft/telemetry\n" }), "ft/telemetry");
});

test("only main enables telemetry and requires a valid connection string", () => {
  assert.deepEqual(telemetryBuildConfig({ branchName: "ft/telemetry", connectionString: validConnectionString }), {
    branchName: "ft/telemetry",
    enabled: false,
    connectionString: null,
  });
  assert.throws(() => telemetryBuildConfig({ branchName: "main", connectionString: "" }), /is required/);
  assert.throws(
    () => telemetryBuildConfig({ branchName: "main", connectionString: "InstrumentationKey=invalid" }),
    /valid InstrumentationKey/,
  );
  assert.equal(
    telemetryBuildConfig({ branchName: "main", connectionString: validConnectionString }).connectionString,
    validConnectionString,
  );
});

test("Eleventy development serving disables telemetry on main without credentials", () => {
  assert.deepEqual(telemetryBuildConfig({ branchName: "main", runMode: "serve", connectionString: "" }), {
    branchName: "main",
    enabled: false,
    connectionString: null,
  });
});

test("connection string validation rejects non-HTTPS ingestion endpoints", () => {
  assert.throws(
    () => validateConnectionString("InstrumentationKey=00000000-0000-4000-8000-000000000001;IngestionEndpoint=http://example.com"),
    /must use HTTPS/,
  );
});

test("Simple Analytics uses an immutable, integrity-checked upstream asset", () => {
  assert.match(SIMPLE_ANALYTICS_VERSION, /^[0-9a-f]{40}$/);
  assert.match(SIMPLE_ANALYTICS_SHA256, /^[0-9a-f]{64}$/);
  assert.match(SIMPLE_ANALYTICS_SOURCE, new RegExp(SIMPLE_ANALYTICS_VERSION));
  assert.throws(() => verifySimpleAnalyticsSource("modified script"), /failed integrity verification/);
});

test("Application Insights configuration permits only operational telemetry", () => {
  const config = createApplicationInsightsConfig("InstrumentationKey=test");

  assert.equal(config.disableCookiesUsage, true);
  assert.equal(config.cookieCfg.enabled, false);
  assert.equal(config.isStorageUseDisabled, true);
  assert.equal(config.enableSessionStorageBuffer, false);
  assert.equal(config.disableExceptionTracking, false);
  assert.equal(config.enableUnhandledPromiseRejectionTracking, true);
  assert.equal(config.disableAjaxTracking, false);
  assert.equal(config.disableFetchTracking, false);
  assert.deepEqual(config.disablePageUnloadEvents, ["unload"]);
  assert.equal(config.enableRequestHeaderTracking, false);
  assert.equal(config.enableResponseHeaderTracking, false);
  assert.equal(config.disableCorrelationHeaders, true);
  assert.equal(config.autoTrackPageVisitTime, false);
  assert.equal(config.enableAutoRouteTracking, false);
});

test("telemetry URLs and text omit query strings and fragments", () => {
  assert.equal(
    sanitizeTelemetryUrl("https://example.com/path?email=person@example.com#details"),
    "https://example.com/path",
  );
  assert.equal(sanitizeTelemetryUrl("/path?token=secret#details", "https://example.com/"), "/path");
  assert.equal(
    sanitizeTelemetryText("Failed at https://example.com/path?token=secret#details"),
    "Failed at https://example.com/path",
  );
});

test("telemetry initializer removes persistent identity and sanitizes page views", () => {
  const item = {
    baseType: "PageviewData",
    baseData: {
      name: "Private page title",
      uri: "https://example.com/blog/post/?email=person@example.com#comments",
      refUri: "https://referrer.example/path?campaign=private",
    },
    ext: { user: { id: "user" }, session: { id: "session" }, trace: { traceID: "operation" } },
    tags: {
      "ai.user.id": "user",
      "ai.user.authUserId": "authenticated-user",
      "ai.user.accountId": "account",
      "ai.session.id": "session",
      "ai.device.type": "Browser",
    },
  };

  assert.equal(createTelemetryInitializer("https://example.com/")(item), true);
  assert.equal(item.baseData.name, "/blog/post/");
  assert.equal(item.baseData.uri, "https://example.com/blog/post/");
  assert.equal(item.baseData.refUri, "https://referrer.example/path");
  assert.equal(item.ext.user, undefined);
  assert.equal(item.ext.session, undefined);
  assert.deepEqual(item.ext.trace, { traceID: "operation" });
  assert.equal(item.tags["ai.user.id"], undefined);
  assert.equal(item.tags["ai.session.id"], undefined);
  assert.equal(item.tags["ai.device.type"], "Browser");
});

test("telemetry initializer retains only sanitized failed dependencies", () => {
  const initialize = createTelemetryInitializer("https://example.com/");
  const successful = {
    baseType: "RemoteDependencyData",
    baseData: { data: "https://api.example/data?token=secret", responseCode: 200, success: true },
  };
  const failed = {
    baseType: "RemoteDependencyData",
    baseData: {
      name: "GET https://api.example/data?token=secret",
      data: "https://api.example/data?token=secret#fragment",
      target: "https://api.example/data?token=secret",
      responseCode: 503,
      success: false,
    },
  };
  const ingestion = {
    baseType: "RemoteDependencyData",
    baseData: {
      data: "https://canadacentral-1.in.applicationinsights.azure.com/v2/track?secret=value",
      responseCode: 503,
      success: false,
    },
  };

  assert.equal(initialize(successful), false);
  assert.equal(initialize(ingestion), false);
  assert.equal(initialize(failed), true);
  assert.equal(failed.baseData.data, "https://api.example/data");
  assert.equal(failed.baseData.target, "https://api.example/data");
  assert.equal(failed.baseData.name, "GET https://api.example/data");
});

test("telemetry initializer sanitizes exception URLs", () => {
  const item = {
    baseType: "ExceptionData",
    baseData: {
      message: "Request failed at https://example.com/api?token=secret",
      exceptions: [
        {
          message: "Request failed at https://example.com/api?token=secret",
          stack: "at https://example.com/app.js?build=private:1:2",
          parsedStack: [
            {
              fileName: "https://example.com/app.js?build=private",
              assembly: "handler (https://example.com/app.js?build=private:1:2)",
            },
          ],
        },
      ],
    },
  };

  assert.equal(createTelemetryInitializer("https://example.com/")(item), true);
  assert.doesNotMatch(JSON.stringify(item), /token=|build=/);
});
