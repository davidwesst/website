import { build } from "esbuild";
import { createHash } from "node:crypto";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { telemetryBuildConfig } from "../lib/telemetry-build.js";

const projectDirectory = resolve(".");
const telemetryDirectory = resolve(".cache", "telemetry");
const applicationInsightsOutputFile = resolve(telemetryDirectory, "application-insights.js");
const simpleAnalyticsOutputFile = resolve(telemetryDirectory, "simple-analytics.js");
const entryFile = "./src/client/application-insights.js";
export const SIMPLE_ANALYTICS_VERSION = "c14b69456bcd6a758067a6fac0541e1a43e10cbb";
export const SIMPLE_ANALYTICS_SHA256 = "820fd384e3307235dbbfe78ac212f9bf936ceb9d9e731b26aa4b852299880d55";
export const SIMPLE_ANALYTICS_SOURCE = `https://raw.githubusercontent.com/simpleanalytics/scripts/${SIMPLE_ANALYTICS_VERSION}/dist/latest/latest.js`;

export function verifySimpleAnalyticsSource(source) {
  const content = Buffer.from(source);
  const actualHash = createHash("sha256").update(content).digest("hex");
  if (actualHash !== SIMPLE_ANALYTICS_SHA256) {
    throw new Error(`Simple Analytics browser asset failed integrity verification: ${actualHash}`);
  }
  return content;
}

function assertTelemetryDirectory() {
  if (dirname(telemetryDirectory) !== resolve(projectDirectory, ".cache")) {
    throw new Error(`Refusing to prepare telemetry in unexpected path: ${telemetryDirectory}`);
  }
}

export async function prepareTelemetry(options = {}) {
  assertTelemetryDirectory();
  const config = telemetryBuildConfig(options);
  await rm(telemetryDirectory, { recursive: true, force: true });

  if (!config.enabled) return config;

  await mkdir(telemetryDirectory, { recursive: true });
  await (options.buildApplicationInsights || build)({
    absWorkingDir: projectDirectory,
    bundle: true,
    define: {
      __APPLICATION_INSIGHTS_CONNECTION_STRING__: JSON.stringify(config.connectionString),
    },
    entryPoints: [entryFile],
    legalComments: "none",
    minify: true,
    outfile: applicationInsightsOutputFile,
    platform: "browser",
    sourcemap: false,
    target: ["es2020"],
  });

  const generated = await stat(applicationInsightsOutputFile);
  if (!generated.isFile() || generated.size === 0) throw new Error("Application Insights browser asset was not generated");

  const response = await (options.fetchImpl || fetch)(SIMPLE_ANALYTICS_SOURCE);
  if (!response.ok) throw new Error(`Unable to prepare Simple Analytics browser asset: HTTP ${response.status}`);
  const simpleAnalyticsSource = verifySimpleAnalyticsSource(await response.arrayBuffer());
  await writeFile(simpleAnalyticsOutputFile, simpleAnalyticsSource);

  return { ...config, applicationInsightsOutputFile, simpleAnalyticsOutputFile };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareTelemetry();
  console.log(result.enabled ? "Prepared first-party telemetry assets." : "Telemetry disabled for this branch.");
}
