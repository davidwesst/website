import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { siteLinkUrl } from "../lib/site-links.js";
import { triageRoutes, triageCsv } from "../lib/route-triage.js";

const [baselineFile, subsequentFile] = process.argv.slice(2);
assert.ok(baselineFile, "Usage: node tools/triage-routes.mjs <baseline.json> [subsequent.json]");
const output = path.resolve("_site");
assert.ok(existsSync(output), "Build the site before triage");

function snapshot(file) {
  const source = readFileSync(file);
  const data = JSON.parse(source);
  assert.equal(data.hostname, "david.wes.st", "Capture only the website host");
  assert.ok(new Date(data.end) > new Date(data.start), "A bounded reporting window is required");
  assert.ok(data.complete === true, "Capture must explicitly confirm that it is complete within its declared scope");
  const rows = data.rows || data.pages?.flatMap((page) => page.rows.map((row) => ({ path: row.dimensions.clientRequestPath, count: row.count })));
  assert.ok(Array.isArray(rows), "Snapshot must contain rows or complete GraphQL pages");
  const seen = new Set();
  for (const row of rows) {
    assert.ok(row && typeof row.path === "string" && row.path.startsWith("/") && !/[?#\r\n]/.test(row.path), "Paths must exclude query strings, fragments, and control characters");
    assert.ok(Number.isFinite(row.count) && row.count >= 0, "Count must be a nonnegative estimate");
    assert.ok(!seen.has(row.path), `Duplicate path: ${row.path}`);
    seen.add(row.path);
  }
  if (data.total404 !== undefined) assert.equal(rows.reduce((sum, row) => sum + row.count, 0), data.total404, "Grouped counts must reconcile with the provider total");
  return { ...data, rows, sha256: createHash("sha256").update(source).digest("hex") };
}

const baseline = snapshot(baselineFile);
const subsequent = subsequentFile ? snapshot(subsequentFile) : undefined;
const files = readdirSync(output, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile());
const published = new Set();
const references = new Map();
const redirects = new Map(readFileSync(path.join(output, "_redirects"), "utf8").trim().split("\n").map((line) => line.split(" ").slice(0, 2)));
for (const entry of files) {
  const file = path.join(entry.parentPath, entry.name);
  const url = `/${path.relative(output, file).replaceAll("\\", "/")}`;
  if (["/_redirects", "/_headers"].includes(url)) continue;
  published.add(url);
  if (url.endsWith("/index.html")) {
    published.add(url.slice(0, -10));
    if (url !== "/index.html") published.add(url.slice(0, -11));
  }
  if (!url.endsWith(".html")) continue;
  const page = url.replace(/index\.html$/, "");
  const $ = load(readFileSync(file, "utf8"));
  for (const element of $("a[href], img[src], iframe[src], script[src], link[href]").toArray()) {
    const reference = $(element).attr("href") ?? $(element).attr("src");
    const resolved = siteLinkUrl(reference, page);
    if (!resolved) continue;
    const referrers = references.get(resolved.pathname) || [];
    if (!referrers.includes(page)) referrers.push(page);
    references.set(resolved.pathname, referrers);
  }
}
const rows = triageRoutes(baseline.rows, { published, references, redirects }, subsequent?.rows, subsequent?.paths ? new Set(subsequent.paths) : undefined);
const summary = {};
for (const row of rows) {
  const group = summary[row.classification] ||= { routes: 0, estimatedResponses: 0 };
  group.routes += 1;
  group.estimatedResponses += row.count;
}
const directory = path.resolve(".cache/route-triage");
mkdirSync(directory, { recursive: true });
const provenance = (data) => data && ({ hostname: data.hostname, start: data.start, end: data.end, capturedAt: data.capturedAt, sha256: data.sha256, estimated: data.estimated, complete: data.complete, scope: data.scope, pages: data.pages?.length });
writeFileSync(path.join(directory, "triage.csv"), triageCsv(rows));
writeFileSync(path.join(directory, "triage.json"), JSON.stringify({ baseline: provenance(baseline), subsequent: provenance(subsequent), summary, rows }, null, 2));
console.log(JSON.stringify({ summary, output: path.join(directory, "triage.csv") }, null, 2));
