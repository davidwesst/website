import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import matter from "gray-matter";
import { BLOG_INDEX_ROUTES, RESERVED_BLOG_SLUGS, canonicalContentUrl } from "../lib/content-routing.js";

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, "src", "content");
const OUTPUT_ROOT = path.join(ROOT, "_site");
const MANIFEST = JSON.parse(readFileSync(path.join(ROOT, "src", "_data", "migration-manifest.json"), "utf8"));
const EXCEPTIONS = JSON.parse(readFileSync(path.join(ROOT, "src", "_data", "asset-exceptions.json"), "utf8"));
const ALLOWED_KEYS = new Set(["title", "date", "updated", "summary", "topics", "redirectFrom", "banner", "customData"]);
const DEPRECATED_KEYS = new Set(["id", "source", "docType", "series", "slug", "taxonomy", "canonicalUrl", "legacyUrls", "media", "review", "meta"]);
const EXPECTED_COUNTS = { articles: 138, gamelogs: 19, dungeonlogs: 12, talks: 12, pages: 2 };
const MIGRATED_COUNTS = { articles: 138, gamelogs: 16, dungeonlogs: 12, talks: 12, pages: 2 };
const EXPECTED_TALK_DATES = {
  "11ty-days-of-web-development": "2024-12-18",
  "a-guide-to-saas-ready-banner-customizations-in-2026": "2026-06-01",
  "consensus-in-the-chaos": "2022-11-28",
  "empowering-campus-innovation-through-ethos-data-connect": "2026-04-19",
  "from-custom-cots-to-cloud": "2022-11-28",
  "going-beyond-powerpoint": "2024-09-25",
  "hack-the-it-governance-matrix": "2023-10-16",
  "integrations-orchestrations-automations": "2024-09-23",
  "is-ai-ready-to-take-over-the-world": "2023-10-16",
  "its-scary-using-new-ai-technology": "2023-12-20",
  "modernization-journey": "2025-10-14",
  "no-mission-impossible": "2024-04-07",
};

function slash(value) {
  return value.replaceAll("\\", "/");
}

function walkFiles(root, predicate = () => true) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.parentPath ? path.join(entry.parentPath, entry.name) : path.join(entry.path, entry.name))
    .filter(predicate);
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function topicSlug(value) {
  return String(value).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function typeFor(file) {
  const relative = slash(path.relative(CONTENT_ROOT, file));
  if (relative.startsWith("posts/articles/")) return "articles";
  if (relative.startsWith("posts/gamelogs/")) return "gamelogs";
  if (relative.startsWith("posts/dungeonlogs/")) return "dungeonlogs";
  if (relative.startsWith("talks/")) return "talks";
  if (relative.startsWith("pages/")) return "pages";
  throw new Error(`Unknown content type: ${relative}`);
}

function canonicalUrl(document) {
  const slug = path.basename(path.dirname(document.file));
  return canonicalContentUrl(document.type, slug);
}

function outputFile(url) {
  return path.join(OUTPUT_ROOT, url.replace(/^\//, ""), "index.html");
}

function exactCaseExists(file) {
  const relative = path.relative(ROOT, file);
  let current = ROOT;
  for (const segment of relative.split(path.sep)) {
    if (segment === "..") return false;
    if (!existsSync(current)) return false;
    const match = readdirSync(current).find((name) => name === segment);
    if (!match) return false;
    current = path.join(current, match);
  }
  return existsSync(current);
}

function parseDate(value, context) {
  assert.ok(value, `${context} must have a date`);
  const date = value instanceof Date ? value : new Date(value);
  assert.ok(!Number.isNaN(date.valueOf()), `${context} has an invalid date`);
  return date;
}

const markdownFiles = walkFiles(CONTENT_ROOT, (file) => path.basename(file) === "index.md");
const documents = markdownFiles.map((file) => {
  const source = readFileSync(file, "utf8");
  const parsed = matter(source);
  return { file, source, data: parsed.data, body: parsed.content, type: typeFor(file) };
});

const counts = Object.fromEntries(Object.keys(EXPECTED_COUNTS).map((type) => [type, documents.filter((document) => document.type === type).length]));
assert.deepEqual(counts, EXPECTED_COUNTS, "Active content counts must match the approved inventory");
assert.deepEqual(Object.fromEntries(Object.entries(MANIFEST.counts).filter(([key]) => key !== "appearances")), MIGRATED_COUNTS);

const urls = new Set();
const redirects = new Map();
const postSlugs = new Map();
const topicRoutes = new Map();
let appearanceCount = 0;

for (const document of documents) {
  const context = slash(path.relative(ROOT, document.file));
  assert.ok(document.data.title, `${context} must have a title`);
  for (const key of Object.keys(document.data)) assert.ok(ALLOWED_KEYS.has(key), `${context} has unsupported field ${key}`);
  for (const key of DEPRECATED_KEYS) assert.equal(document.data[key], undefined, `${context} retains deprecated field ${key}`);

  const slug = path.basename(path.dirname(document.file));
  if (["articles", "gamelogs", "dungeonlogs"].includes(document.type)) {
    assert.ok(!RESERVED_BLOG_SLUGS.has(slug), `${context} uses reserved blog index slug ${slug}`);
    assert.ok(!postSlugs.has(slug), `${context} duplicates post slug owned by ${postSlugs.get(slug)}`);
    postSlugs.set(slug, context);
  }

  if (document.type !== "pages") parseDate(document.data.date, context);
  if (document.data.updated) parseDate(document.data.updated, `${context} updated`);
  if (document.type === "talks") {
    assert.match(document.source, /^date:\s*['"]?\d{4}-\d{2}-\d{2}/m, `${context} must author a publication date`);
    assert.equal(new Date(document.data.date).toISOString().slice(0, 10), EXPECTED_TALK_DATES[slug], `${context} must use its approved publication or latest presentation date`);
    assert.ok(Array.isArray(document.data.customData?.speakers) && document.data.customData.speakers.length, `${context} needs speakers`);
    assert.ok(document.data.customData?.appearances === undefined || Array.isArray(document.data.customData.appearances), `${context} appearances must be a list`);
    appearanceCount += document.data.customData.appearances?.length || 0;
  }
  if (document.type === "gamelogs") {
    assert.ok(document.data.customData?.game?.ids?.igdb, `${context} needs an IGDB id`);
    assert.ok(document.data.customData?.playthrough, `${context} needs playthrough data`);
    assert.ok(document.data.customData?.ratings?.overall, `${context} needs ratings`);
  }
  if (["gamelogs", "dungeonlogs"].includes(document.type)) {
    const legacyType = document.type === "gamelogs" ? "gamelog" : "dungeonlog";
    assert.ok(document.data.redirectFrom?.includes(`/blog/${legacyType}/${slug}/`), `${context} must preserve its archived hierarchical canonical URL`);
  }
  if (["articles", "dungeonlogs"].includes(document.type)) assert.equal(document.data.customData, undefined, `${context} must omit empty customData`);

  const topics = document.data.topics || [];
  assert.equal(new Set(topics).size, topics.length, `${context} has duplicate topics`);
  for (const topic of topics) {
    const slug = topicSlug(topic);
    assert.ok(slug, `${context} has an invalid topic`);
    const prior = topicRoutes.get(slug);
    assert.ok(!prior || prior === topic, `Topic slug collision: ${prior} and ${topic}`);
    topicRoutes.set(slug, topic);
  }

  if (document.data.banner) {
    assert.match(document.data.banner.src, /^\.\/[^/]+$/, `${context} banner must reference an image beside the document`);
    assert.ok(document.data.banner.alt?.trim(), `${context} banner needs alt text`);
    assert.notEqual(document.data.banner.alt.trim().toLowerCase(), "alt text goes here.", `${context} has placeholder alt text`);
    const sourceBanner = path.join(path.dirname(document.file), document.data.banner.src);
    assert.ok(exactCaseExists(sourceBanner), `${context} source banner is not colocated or has incorrect filename casing`);
    const bannerFile = path.join(path.dirname(outputFile(canonicalUrl(document))), path.basename(document.data.banner.src));
    assert.ok(exactCaseExists(bannerFile), `${context} banner is missing or has incorrect filename casing`);
  }

  const url = canonicalUrl(document);
  assert.ok(!urls.has(url), `Duplicate canonical URL: ${url}`);
  urls.add(url);
  for (const source of document.data.redirectFrom || []) {
    assert.ok(!redirects.has(source), `Duplicate redirect source: ${source}`);
    redirects.set(source, url);
  }
}

assert.equal(appearanceCount, 22, "All talk appearances must be migrated");
assert.equal(postSlugs.size, EXPECTED_COUNTS.articles + EXPECTED_COUNTS.gamelogs + EXPECTED_COUNTS.dungeonlogs, "Every post must have a globally unique flat-route slug");
for (const [source, target] of redirects) {
  assert.notEqual(source, target, `Redirect source equals target: ${source}`);
  assert.ok(!redirects.has(target), `Redirect chain begins at ${source}`);
  assert.ok(!urls.has(source), `Redirect source collides with canonical URL: ${source}`);
}

assert.equal(MANIFEST.assets.length, 197, "All available image assets must be tracked");
for (const asset of MANIFEST.assets) {
  const file = path.join(ROOT, asset.destination);
  assert.ok(asset.destination.startsWith("src/content/"), `Asset is not colocated with content: ${asset.destination}`);
  assert.ok(exactCaseExists(path.join(path.dirname(file), "index.md")), `Asset has no owning content document: ${asset.destination}`);
  assert.ok(exactCaseExists(file), `Migrated asset is missing or has incorrect filename casing: ${asset.destination}`);
  assert.equal(sha256(file), asset.sha256, `Migrated asset hash differs: ${asset.destination}`);
}
assert.equal(walkFiles(path.join(ROOT, "src", "assets", "content")).length, 0, "Centralized content assets must remain empty");

const exceptionKeys = new Set();
for (const exception of EXCEPTIONS) {
  const key = `${exception.document}\0${exception.reference}`;
  assert.ok(!exceptionKeys.has(key), `Duplicate asset exception: ${exception.document} ${exception.reference}`);
  exceptionKeys.add(key);
  assert.ok(documents.some((document) => `${document.type}/${path.basename(path.dirname(document.file))}` === exception.document), `Asset exception references a missing document: ${exception.document}`);
}

for (const document of documents) {
  const file = outputFile(canonicalUrl(document));
  assert.ok(exactCaseExists(file), `Missing rendered document: ${slash(path.relative(ROOT, file))}`);
  const $ = load(readFileSync(file, "utf8"));
  assert.equal($("main").length, 1, `${canonicalUrl(document)} must have one main landmark`);
  assert.equal($("main > article").length, 1, `${canonicalUrl(document)} must have one top-level article`);
  assert.equal($("h1").length, 1, `${canonicalUrl(document)} must have one h1`);
  assert.equal($("h1").text().trim(), document.data.title, `${canonicalUrl(document)} renders the wrong title`);
  if (document.type !== "pages") assert.ok($("time").length, `${canonicalUrl(document)} must render a publication date`);
  if (document.data.banner) {
    const image = $("figure img").first();
    assert.equal(image.attr("src"), document.data.banner.src, `${canonicalUrl(document)} renders the wrong banner`);
    assert.equal(image.attr("alt"), document.data.banner.alt, `${canonicalUrl(document)} renders the wrong banner alt text`);
  }
  if (document.type === "gamelogs") {
    const playthrough = document.data.customData.playthrough;
    const expectedDetails = [playthrough.started, playthrough.completed, playthrough.platform].filter(Boolean).length
      + Object.keys(document.data.customData.ratings).length;
    assert.equal($("dl dt").length, expectedDetails, `${canonicalUrl(document)} must render all authored playthrough and rating data`);
  }
  if (document.type === "talks") {
    assert.equal($("header time").first().attr("datetime"), EXPECTED_TALK_DATES[path.basename(path.dirname(document.file))], `${canonicalUrl(document)} must render its publication or latest presentation date`);
    assert.equal($("#appearances-heading + ol > li").length, document.data.customData.appearances?.length || 0, `${canonicalUrl(document)} renders the wrong appearance count`);
  }
}

const configPath = path.join(OUTPUT_ROOT, "staticwebapp.config.json");
const configSource = readFileSync(configPath, "utf8");
assert.ok(Buffer.byteLength(configSource) <= 20 * 1024, "Azure Static Web Apps configuration exceeds 20 KB");
const config = JSON.parse(configSource);
assert.equal(config.trailingSlash, "always");
const configuredRoutes = new Map(config.routes.map((route) => [route.route, route]));
assert.equal(configuredRoutes.get("/blog/gamelog/entry.html")?.rewrite, "/legacy/gamelog-entry.html");
assert.equal(configuredRoutes.get("/blog/gamelog/")?.redirect, BLOG_INDEX_ROUTES.gamelogs);
assert.equal(configuredRoutes.get("/blog/dungeonlog/")?.redirect, BLOG_INDEX_ROUTES.dungeonlogs);
for (const [source, target] of redirects) {
  if (source.includes("?")) continue;
  if (source.endsWith("/index.html") && source.slice(0, -"index.html".length) === target) continue;
  assert.equal(configuredRoutes.get(source)?.redirect, target, `Missing Azure redirect for ${source}`);
}

const dispatcher = readFileSync(path.join(OUTPUT_ROOT, "legacy", "gamelog-entry.html"), "utf8");
for (const document of documents.filter((item) => item.type === "gamelogs")) {
  const slug = path.basename(path.dirname(document.file));
  assert.match(dispatcher, new RegExp(`"${slug}":"${canonicalUrl(document).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `Legacy dispatcher is missing ${slug}`);
}

for (const route of Object.values(BLOG_INDEX_ROUTES)) assert.ok(exactCaseExists(outputFile(route)), `Missing post type index: ${route}`);
assert.ok(!existsSync(path.join(OUTPUT_ROOT, "blog", "gamelog")), "Unpublished nested gamelog output must not be generated");
assert.ok(!existsSync(path.join(OUTPUT_ROOT, "blog", "dungeonlog")), "Unpublished nested dungeonlog output must not be generated");

function resolveLocalTarget(currentFile, href) {
  const currentUrl = `https://site.test/${slash(path.relative(OUTPUT_ROOT, currentFile)).replace(/index\.html$/, "")}`;
  const parsed = new URL(href, currentUrl);
  const pathname = decodeURIComponent(parsed.pathname);
  if (configuredRoutes.has(pathname)) return { file: undefined, fragment: parsed.hash, redirected: true };
  const relative = pathname.replace(/^\//, "");
  const direct = path.join(OUTPUT_ROOT, relative);
  if (path.extname(pathname)) return { file: direct, fragment: parsed.hash };
  return { file: path.join(direct, "index.html"), fragment: parsed.hash };
}

const htmlFiles = walkFiles(OUTPUT_ROOT, (file) => file.endsWith(".html"));
const brokenLinks = [];
for (const file of htmlFiles) {
  const source = readFileSync(file, "utf8");
  assert.ok(!source.includes("_archive"), `${slash(path.relative(OUTPUT_ROOT, file))} leaks an archive path`);
  assert.ok(!/MISSING_IMG|sediment:\/\/|oai_citation|\[object Object\]|\bwebc:|\s:[@a-z-]+=/i.test(source), `${slash(path.relative(OUTPUT_ROOT, file))} contains unresolved migration or WebC output`);
  assert.equal(load(source)("template").length, 0, `${slash(path.relative(OUTPUT_ROOT, file))} contains inert template markup`);
  const $ = load(source);
  for (const image of $("img").toArray()) {
    const src = $(image).attr("src");
    assert.ok(src, `${slash(path.relative(OUTPUT_ROOT, file))} has an image without src`);
    assert.ok($(image).attr("alt")?.trim(), `${slash(path.relative(OUTPUT_ROOT, file))} has an image without alt text`);
    if (/^(?:https?:)?\/\//.test(src) || src.startsWith("data:")) continue;
    const target = resolveLocalTarget(file, src).file;
    assert.ok(target && exactCaseExists(target), `${slash(path.relative(OUTPUT_ROOT, file))} has broken image ${src}`);
  }
  for (const anchor of $("a[href]").toArray()) {
    const href = $(anchor).attr("href");
    if (/^(?:https?:|mailto:|tel:|javascript:|data:|\/\/)/i.test(href)) continue;
    const target = resolveLocalTarget(file, href);
    if (target.redirected) continue;
    if (!target.file || !exactCaseExists(target.file)) {
      brokenLinks.push(`${slash(path.relative(OUTPUT_ROOT, file))}: ${href}`);
      continue;
    }
    if (target.fragment) {
      const targetDocument = load(readFileSync(target.file, "utf8"));
      const id = decodeURIComponent(target.fragment.slice(1));
      assert.ok(targetDocument(`[id="${id.replaceAll('"', '\\"')}"]`).length || targetDocument(`a[name="${id.replaceAll('"', '\\"')}"]`).length, `${slash(path.relative(OUTPUT_ROOT, file))} links to missing fragment ${href}`);
    }
  }
}

assert.equal(brokenLinks.length, 0, `Broken local links:\n${brokenLinks.join("\n")}`);

console.log(`Content integrity passed for ${documents.length} documents, ${MANIFEST.assets.length} assets, ${topicRoutes.size} topics, and ${redirects.size} legacy URLs.`);
