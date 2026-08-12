import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { prepareIgdb } from "../lib/igdb.js";

const contentDirectory = path.resolve("src", "content", "posts", "gamelogs");
const entries = await readdir(contentDirectory, { withFileTypes: true });
const ids = [];

for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
  const source = await readFile(path.join(contentDirectory, entry.name, "index.md"), "utf8");
  const id = matter(source).data.customData?.game?.ids?.igdb;
  if (!Number.isInteger(id)) throw new Error(`${entry.name} does not have an integer IGDB ID`);
  ids.push(id);
}

const requireRefresh = process.argv.includes("--require-refresh");
const result = await prepareIgdb({ ids, forceRefresh: process.argv.includes("--force") });
console.log(`IGDB preparation: ${result.status} (${Object.keys(result.manifest?.games || {}).length} games)`);

if (requireRefresh && result.status !== "refreshed") {
  console.error("IGDB local refresh did not complete; see the warning above for details.");
  process.exitCode = 1;
}
