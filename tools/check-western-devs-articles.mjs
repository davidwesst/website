import assert from "node:assert/strict";
import path from "node:path";
import { appendFile } from "node:fs/promises";
import config from "../config/western-devs.json" with { type: "json" };
import site from "../src/_data/site.js";
import { git } from "../lib/crosspost-history.js";
import { selectUnsubmittedArticles } from "../lib/western-devs-eligibility.js";

const root = process.cwd();
const commit = git(root, ["rev-parse", "HEAD"]).trim();
if (process.env.GITHUB_SHA) assert.equal(commit, process.env.GITHUB_SHA, "Eligibility checkout must match the publishing commit");
const { pending, skipped } = await selectUnsubmittedArticles({
  root, targetRoot: path.join(root, ".cache", "western-devs-target"), commit,
  activationCommit: config.activationCommit, repository: config.sourceRepository, origin: site.url,
});
console.log(`${pending.length} unsubmitted eligible article(s); ${skipped.length} already acknowledged.`);
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `pending-count=${pending.length}\n`);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY,
  `## Article sharing eligibility\n\nUnsubmitted articles: ${pending.length}. Previously submitted: ${skipped.length}.\n${pending.length ? "Article sharing will be dispatched." : "No article-sharing run is needed."}\n`);
