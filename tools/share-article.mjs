import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import site from "../src/_data/site.js";
import { shareArticle } from "../lib/article-sharing.js";

const usage = "Usage: pnpm share <article-slug> <destination> [--publish] [--wait]";
export function parseSharingArgs(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  if (args.includes("--help") || args.includes("-h")) return { help: true };
  const positionals = [];
  let publish = false, wait = false;
  for (const arg of args) {
    if (arg === "--publish") publish = true;
    else if (arg === "--wait") wait = true;
    else { assert.ok(!arg.startsWith("-"), `Unknown option: ${arg}\n${usage}`); positionals.push(arg); }
  }
  assert.equal(positionals.length, 2, usage);
  assert.ok(!wait || publish, "--wait requires --publish");
  return { slug: positionals[0], destination: positionals[1], publish, wait };
}

async function main() {
  const options = parseSharingArgs(process.argv.slice(2));
  if (options.help) {
    console.log(`${usage}\n\nPrepare a local preview by default. --publish submits it; --wait also checks the target deployment.\nDestinations are configured in config/sharing.json. Build the site with pnpm build first.`);
    return;
  }
  const result = await shareArticle(options.slug, options.destination, { ...options, origin: site.url, onProgress: console.log });
  const action = { prepared: "Prepared", published: "Published", already_shared: "Already shared" }[result.status];
  console.log(`${action} ${result.slug} for ${result.destinationName}.`);
  if (result.files.length) console.log(`Preview: ${path.relative(process.cwd(), result.previewRoot)}`);
  const commit = [...result.published, ...result.skipped][0]?.commit;
  if (commit) console.log(`Target commit: https://github.com/${result.repository}/commit/${commit}`);
  console.log(`Report: ${path.relative(process.cwd(), result.reportPath)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    if (error.reportPath) console.error(`Report: ${path.relative(process.cwd(), error.reportPath)}`);
    process.exitCode = 1;
  });
}
