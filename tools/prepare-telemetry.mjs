import { build } from "esbuild";
import { mkdir, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { telemetryBuildConfig } from "../lib/telemetry-build.js";

const projectDirectory = resolve(".");
const telemetryDirectory = resolve(".cache", "telemetry");
const outputFile = resolve(telemetryDirectory, "application-insights.js");
const entryFile = "./src/client/application-insights.js";

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
  await build({
    absWorkingDir: projectDirectory,
    bundle: true,
    define: {
      __APPLICATION_INSIGHTS_CONNECTION_STRING__: JSON.stringify(config.connectionString),
    },
    entryPoints: [entryFile],
    legalComments: "none",
    minify: true,
    outfile: outputFile,
    platform: "browser",
    sourcemap: false,
    target: ["es2020"],
  });

  const generated = await stat(outputFile);
  if (!generated.isFile() || generated.size === 0) throw new Error("Application Insights browser asset was not generated");
  return { ...config, outputFile };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareTelemetry();
  console.log(result.enabled ? "Prepared first-party Application Insights asset." : "Telemetry disabled for this branch.");
}
