import assert from "node:assert/strict";
import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { git, submittedCrossposts } from "./crosspost-history.js";

// Read public target history without storing the publication token in Git.
export function targetSnapshot({ root, destination }) {
  const targetRoot = path.join(root, ".cache/sharing/targets", destination.key);
  const remote = `https://github.com/${destination.repository}.git`;
  return async () => {
    if (!existsSync(targetRoot)) {
      await mkdir(path.dirname(targetRoot), { recursive: true });
      git(root, ["clone", "--no-checkout", "--single-branch", "--branch", destination.branch, remote, targetRoot], { env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
    }
    assert.equal(git(targetRoot, ["remote", "get-url", "origin"]).trim(), remote, "Cached sharing target does not match the configured repository");
    git(targetRoot, ["fetch", "origin", destination.branch], { env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
    const commit = git(targetRoot, ["rev-parse", "FETCH_HEAD"]).trim();
    return {
      commit, tree: git(targetRoot, ["rev-parse", `${commit}^{tree}`]).trim(),
      paths: new Set(git(targetRoot, ["ls-tree", "-r", "--name-only", commit]).trim().split("\n")),
      submitted: submittedCrossposts(targetRoot, commit),
    };
  };
}
