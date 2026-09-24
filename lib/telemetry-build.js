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

export function telemetryBuildConfig(options = {}) {
  const branchName = options.branchName ?? resolveBranchName(options);
  const runMode = options.runMode ?? process.env.ELEVENTY_RUN_MODE ?? "build";
  return { branchName, enabled: runMode === "build" && branchName === PRODUCTION_BRANCH };
}
