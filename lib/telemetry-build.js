import { execFileSync } from "node:child_process";

export const PRODUCTION_BRANCH = "main";

function readCurrentGitBranch(cwd) {
  return execFileSync("git", ["branch", "--show-current"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

export function resolveBranchName(options = {}) {
  const githubRefName = options.githubRefName ?? process.env.GITHUB_REF_NAME;
  if (githubRefName?.trim()) return githubRefName.trim();

  try {
    return (options.readCurrentBranch || readCurrentGitBranch)(options.cwd || process.cwd()).trim();
  } catch {
    return "";
  }
}

export function validateConnectionString(connectionString) {
  if (typeof connectionString !== "string" || !connectionString.trim()) {
    throw new Error("APPLICATIONINSIGHTS_CONNECTION_STRING is required for main branch builds");
  }

  const fields = Object.fromEntries(
    connectionString
      .split(";")
      .map((field) => field.split("="))
      .filter((parts) => parts.length === 2)
      .map(([key, value]) => [key.trim().toLowerCase(), value.trim()]),
  );

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fields.instrumentationkey || "")) {
    throw new Error("APPLICATIONINSIGHTS_CONNECTION_STRING must contain a valid InstrumentationKey");
  }

  if (fields.ingestionendpoint) {
    let endpoint;
    try {
      endpoint = new URL(fields.ingestionendpoint);
    } catch {
      throw new Error("APPLICATIONINSIGHTS_CONNECTION_STRING contains an invalid IngestionEndpoint");
    }
    if (endpoint.protocol !== "https:") {
      throw new Error("APPLICATIONINSIGHTS_CONNECTION_STRING IngestionEndpoint must use HTTPS");
    }
  }

  return connectionString.trim();
}

export function telemetryBuildConfig(options = {}) {
  const branchName = options.branchName ?? resolveBranchName(options);
  if (branchName !== PRODUCTION_BRANCH) return { branchName, enabled: false, connectionString: null };

  const connectionString = validateConnectionString(
    options.connectionString ?? process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  );
  return { branchName, enabled: true, connectionString };
}
