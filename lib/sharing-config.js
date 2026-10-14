import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

export async function sharingDestination(root, key) {
  assert.match(key || "", /^[a-z][a-z0-9-]*$/, "A configured destination name is required");
  const config = JSON.parse(await readFile(path.join(root, "config/sharing.json"), "utf8"));
  assert.match(config.sourceRepository || "", /^[\w.-]+\/[\w.-]+$/, "Invalid source repository in config/sharing.json");
  const destinations = config.destinations || {};
  assert.ok(Object.hasOwn(destinations, key), `Unknown sharing destination: ${key}. Configured destinations: ${Object.keys(destinations).join(", ") || "none"}`);
  const destination = destinations[key];
  assert.match(destination.adapter || "", /^[a-z][a-z0-9-]*$/, "A destination adapter is required");
  assert.match(destination.repository || "", /^[\w.-]+\/[\w.-]+$/, "Invalid destination repository");
  assert.match(destination.branch || "", /^[a-zA-Z0-9][\w./-]*$/, "Invalid destination branch");
  assert.ok(!destination.branch.includes(".."), "Invalid destination branch");
  assert.ok(typeof destination.name === "string" && destination.name.trim(), "A destination name is required");
  assert.ok(typeof destination.authorId === "string" && destination.authorId.trim(), "A destination authorId is required");
  assert.match(destination.tokenEnv || "", /^[A-Z][A-Z0-9_]*$/, "A destination token environment variable is required");
  assert.match(destination.workflow || "", /^[\w.-]+\.ya?ml$/, "A destination workflow filename is required");
  return { sourceRepository: config.sourceRepository, destination: { ...destination, key } };
}
