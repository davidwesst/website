import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { load } from "cheerio";
import matter from "gray-matter";
import { getPostDescription, prepareHomeContent } from "../src/_lib/home-content.js";
import { preparePageMetadata } from "../src/_lib/page-metadata.js";
import { prepareContentNavigation } from "../src/_lib/content-navigation.js";
import site from "../src/_data/site.js";
import { IGDB_CACHE_SCHEMA_VERSION, hasCachedImages, readIgdbManifest } from "../lib/igdb.js";
import { telemetryBuildConfig } from "../lib/telemetry-build.js";
import { campaignUrl } from "../lib/campaign-links.js";

const output = join(process.cwd(), "_site");
const content = join(process.cwd(), "src", "content");
const igdbManifest = readIgdbManifest();
const igdbGames = igdbManifest?.schemaVersion === IGDB_CACHE_SCHEMA_VERSION && hasCachedImages(igdbManifest) ? igdbManifest.games || {} : {};

async function collection(relativePath) {
  const root = join(content, relativePath);
  const directories = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  return Promise.all(directories.map(async (entry) => {
    const { data } = matter(await readFile(join(root, entry.name, "index.md"), "utf8"));
    return { ...data, slug: entry.name };
  }));
}

const inventory = Promise.all([
  collection(join("posts", "articles")),
  collection(join("posts", "gamelogs")),
  collection(join("posts", "dungeonlogs")),
  collection("talks"),
]).then(([articles, gamelogs, dungeonlogs, talks]) => ({ articles, gamelogs, dungeonlogs, talks }));

async function page(relativePath) {
  return load(await readFile(join(output, relativePath), "utf8"));
}

test("the home page renders the Ghostwind shell and configured content", async () => {
  const $ = await page("index.html");
  const authored = await inventory;
  assert.equal($("h1").text(), site.title);
  assert.equal($("link[rel=stylesheet][href='/assets/main.css']").length, 1);
  assert.equal($("link[href='/assets/fontawesome.css']").length, 1);
  assert.match($("body").attr("class"), /bg-slate-100/);
  const primaryNavigation = $("nav[aria-label='Primary navigation']");
  assert.equal(primaryNavigation.children("a[href='/']").text(), site.navigationTitle);
  assert.deepEqual(primaryNavigation.find("ul a").map((_, link) => $(link).text().trim()).get(), site.navigationLinks.map((link) => link.name));
  assert.equal(primaryNavigation.find("a[href='/projects/']").length, 0);
  const featured = $("#featured-heading + article");
  const eligible = [
    ...authored.articles.map((item) => ({ date: item.date, url: `/blog/${item.slug}/` })),
    ...authored.gamelogs.map((item) => ({ date: item.date, url: `/blog/${item.slug}/` })),
    ...authored.talks.map((item) => ({ date: item.date, url: `/talks/${item.slug}/` })),
  ].sort((left, right) => new Date(right.date) - new Date(left.date));
  const expectedFeaturedUrl = site.featuredPost || eligible[0].url;
  assert.equal(featured.find("h2 a").attr("href"), expectedFeaturedUrl);
  assert.ok(featured.find(".post-card-description").text().trim());
  assert.match($("#recent-heading").closest("section").find("ol > li article time").first().closest("footer").attr("class"), /\bmt-auto\b/);
  assert.match($("#recent-heading").closest("section").find("ol > li article time").first().closest("footer").attr("class"), /\bpt-6\b/);
  for (const section of site.homeSections) assert.equal($(`#home-${section.type}`).attr("href"), section.url);
  assert.equal($("#recent-heading").closest("section").find("ol.home-posts > li").length, site.homeSections.length * site.recentPostCount);
  assert.equal($("#home-article").length, 1);
  assert.equal($("#home-gamelog").length, 1);
  assert.equal($("#home-talk").length, 1);
  assert.equal($("#recent-heading").closest("section").find("[data-content-type='dungeonlog']").length, 0);
  const pageLinks = $("#explore-heading").closest("section").find("ul > li a");
  assert.deepEqual(pageLinks.map((_, link) => $(link).find("strong").text().trim()).get(), site.exploreLinks.map((item) => item.label));
  assert.equal(pageLinks.filter("[href='/projects/']").length, 1);
  const heroSocialLinks = $("header ul[aria-label='Social links'] a");
  const footerSocialLinks = $("footer ul[aria-label='Social links'] a");
  assert.equal(heroSocialLinks.length, site.socialLinks.length);
  assert.equal(footerSocialLinks.length, site.socialLinks.length);
  assert.deepEqual(heroSocialLinks.map((_, link) => $(link).text().trim()).get(), site.socialLinks.map((link) => link.name));
  assert.deepEqual(footerSocialLinks.map((_, link) => $(link).text().trim()).get(), site.socialLinks.map((link) => link.name));
  assert.match(heroSocialLinks.first().find("i").attr("class"), /fa-github/);
  assert.match(footerSocialLinks.first().find("i").attr("class"), /fa-github/);
  const blueskyLinks = $("a[href='https://bsky.app/profile/davidwesst.bsky.social']");
  assert.equal(blueskyLinks.length, 2);
  assert.match(blueskyLinks.first().find("i").attr("class"), /fa-bluesky/);
  assert.equal($("footer a[href='https://github.com/tailwindtoolbox/Ghostwind/']").text(), "Ghostwind");
  assert.equal($("footer a[href='https://www.11ty.dev/']").text(), "Build Awesome / 11ty");
});

test("Font Awesome CSS and webfonts are included in the build", async () => {
  const stylesheet = await readFile(join(output, "assets", "fontawesome.css"), "utf8");
  const brandsFont = await readFile(join(output, "webfonts", "fa-brands-400.woff2"));
  const solidFont = await readFile(join(output, "webfonts", "fa-solid-900.woff2"));

  assert.match(stylesheet, /url\(\.\.\/webfonts\/fa-brands-400\.woff2\)/);
  assert.match(stylesheet, /url\(\.\.\/webfonts\/fa-solid-900\.woff2\)/);
  assert.ok(brandsFont.length > 0);
  assert.ok(solidFont.length > 0);
});

test("the home feed keeps its asymmetric mosaic at large viewports", async () => {
  const stylesheet = await readFile(join(process.cwd(), "src", "styles", "main.css"), "utf8");
  assert.match(stylesheet, /\.home-posts\s*>\s*li:nth-child\(1\)[\s\S]*grid-column:\s*span 2/);
  assert.match(stylesheet, /\.home-posts\s*>\s*li:nth-child\(4\)[\s\S]*grid-column:\s*span 3/);
  assert.match(stylesheet, /\.home-posts\s*>\s*li:nth-child\(6\)[\s\S]*grid-column:\s*span 4/);
  assert.match(stylesheet, /\.home-posts\s*>\s*li:nth-child\(1\) figure[\s\S]*height:\s*18rem/);
  assert.match(stylesheet, /\.home-posts\s*>\s*li:nth-child\(4\) figure[\s\S]*height:\s*14rem/);
});

test("operational telemetry is branch-gated and served as a first-party asset", async () => {
  const $ = await page("index.html");
  const telemetry = telemetryBuildConfig();
  const script = $("script[src='/assets/telemetry/application-insights.js']");
  const externalTelemetryScripts = $("script[src]").filter((_, element) => {
    const src = $(element).attr("src");
    return /^(?:https?:)?\/\//i.test(src) && /(?:applicationinsights|monitor\.azure|services\.visualstudio\.com|simpleanalytics)/i.test(src);
  });

  assert.equal(script.length, telemetry.enabled ? 1 : 0);
  assert.equal(externalTelemetryScripts.length, 0);

  const asset = readFile(join(output, "assets", "telemetry", "application-insights.js"), "utf8");
  if (telemetry.enabled) {
    assert.ok((await asset).length > 0);
  } else {
    await assert.rejects(asset, { code: "ENOENT" });
  }
});

test("engagement analytics is branch-gated, privacy-sensitive, and served as a first-party asset", async () => {
  const $ = await page("index.html");
  const telemetry = telemetryBuildConfig();
  const script = $("script[src='/assets/telemetry/simple-analytics.js']");

  assert.equal(script.length, telemetry.enabled ? 1 : 0);
  assert.equal(script.attr("data-collect-dnt"), undefined);
  assert.equal(script.attr("data-ignore-metrics"), telemetry.enabled ? "session" : undefined);
  assert.equal(script.attr("data-strict-utm"), telemetry.enabled ? "true" : undefined);

  const asset = readFile(join(output, "assets", "telemetry", "simple-analytics.js"), "utf8");
  if (telemetry.enabled) assert.ok((await asset).length > 0);
  else await assert.rejects(asset, { code: "ENOENT" });
});

test("featured descriptions prefer summaries and fall back to the Markdown introduction", () => {
  assert.equal(
    getPostDescription({ data: { summary: "Authored summary" }, templateContent: "<p>Body introduction</p>" }),
    "Authored summary",
  );
  assert.equal(
    getPostDescription({
      data: {},
      templateContent: "<p>Queens don’t clap.</p><p>They assess.</p><p>We entered the ruin carrying just enough hope to make it embarrassing.</p>",
    }),
    "Queens don’t clap. They assess. We entered the ruin carrying just enough hope to make it embarrassing.",
  );
});

test("featured post selection defaults to latest, supports configuration, and rejects mistakes", () => {
  const posts = [
    { url: "/older/", date: new Date("2024-01-01") },
    { url: "/newer/", date: new Date("2025-01-01") },
    { url: "/middle/", date: new Date("2024-06-01") },
  ];
  assert.equal(prepareHomeContent(posts, null, 2).featured.url, "/newer/");
  assert.equal(prepareHomeContent(posts, "/older/", 2).featured.url, "/older/");
  assert.deepEqual(prepareHomeContent(posts, "/older/", 2).recent.map((item) => item.url), ["/newer/", "/middle/"]);
  assert.throws(() => prepareHomeContent(posts, "/missing/", 2), /was not found/);
  assert.equal(prepareHomeContent([...posts, { url: "/dungeon/", date: new Date("2026-01-01"), data: { type: "dungeonlog" } }], null, 2).featured.url, "/newer/");
});

test("representative post types render normalized data", async () => {
  const article = await page("blog/from-11ty-to-wordpress-and-back-again/index.html");
  assert.equal(article("h1").text(), "From 11ty to Wordpress and Back Again");
  assert.equal(article("time").first().attr("datetime"), "2025-01-30");
  assert.equal(article("figure img").attr("src"), "./from-11ty-to-wordpress-and-back-again_title-image.webp");

  const gamelog = await page("blog/clair-obscur-expedition-33/index.html");
  assert.match(gamelog("dl").text(), /XBox Series X/);
  assert.match(gamelog("dl").text(), /overall\s*3/);
  assert.equal(gamelog(".play-detail-card").length, 3);
  assert.equal(gamelog(".rating-detail-row").length, 1);
  assert.ok(gamelog(".rating-detail-row .rating-detail-card").length >= 1);
  if (igdbGames[305152]) {
    assert.equal(gamelog("#game-details-heading").text(), "Game details");
    assert.match(gamelog("#game-details-heading + dl").text(), /Released/);
    if (igdbGames[305152].ageRatings?.length) {
      assert.equal(gamelog("#game-details-heading + dl dt").filter((_, element) => gamelog(element).text() === "Ratings").length, 1);
      assert.match(gamelog("#game-details-heading + dl").text(), /ESRB|PEGI|CERO/);
    }
    assert.equal(gamelog("footer a[href='https://www.igdb.com/']").text(), "IGDB.com");
  }

  const julyGamelog = await page("blog/paranormasight-the-mermaids-curse/index.html");
  assert.equal(julyGamelog("h1").text(), "Paranormasight: The Mermaid's Curse");
  assert.equal(julyGamelog("time").first().attr("datetime"), "2026-07-23");
  assert.match(julyGamelog("dl").text(), /overall\s*2/);

  const dungeonlog = await page("blog/2026-03-16/index.html");
  assert.equal(dungeonlog("h1").text(), "The Queen Who Refused to Die");
  assert.ok(dungeonlog("figure img").length);
});

test("detail pages link to their type-specific archives", async () => {
  const cases = [
    ["blog/from-11ty-to-wordpress-and-back-again/index.html", "article", "/blog/articles/"],
    ["blog/clair-obscur-expedition-33/index.html", "gamelog", "/blog/gamelogs/"],
    ["blog/2026-03-16/index.html", "dungeonlog", "/blog/dungeonlogs/"],
    ["talks/no-mission-impossible/index.html", "talk", "/talks/"],
  ];

  for (const [path, type, archiveUrl] of cases) {
    const $ = await page(path);
    const archive = $(`a[href='${archiveUrl}']`).filter((_, element) => $(element).text().includes("Explore the complete"));
    assert.equal(archive.text().replace(/\s+/g, " ").trim(), `Explore the complete ${type} archive`);
  }
});

test("post visuals use banners or accessible type-specific fallbacks", async () => {
  const article = await page("blog/i-miss-blogging/index.html");
  assert.equal(article("figure [role=img]").attr("aria-label"), "Article placeholder image");
  assert.match(article("figure [role=img] i").attr("class"), /fa-newspaper/);

  const gamelog = await page("blog/the-ratline/index.html");
  if (igdbGames[351273]?.banner) {
    assert.equal(gamelog("figure img").attr("src"), igdbGames[351273].banner.src);
    assert.equal(gamelog("figure img").attr("alt"), igdbGames[351273].banner.alt);
  } else {
    assert.equal(gamelog("figure [role=img]").attr("aria-label"), "Gamelog placeholder image");
    assert.match(gamelog("figure [role=img] i").attr("class"), /fa-gamepad/);
  }

  const dungeonlog = await page("blog/2026-03-16/index.html");
  assert.equal(dungeonlog("figure img").attr("src"), "./2026-03-16_Poster.png");
  assert.equal(dungeonlog("figure [role=img]").length, 0);
});

test("talks render publication and appearance dates separately", async () => {
  const $ = await page("talks/no-mission-impossible/index.html");
  assert.equal($("header time").first().attr("datetime"), "2024-04-07");
  assert.equal($("#appearances-heading + ol > li").length, 1);
  assert.equal($("#appearances-heading + ol time").first().attr("datetime"), "2024-04-07");
  assert.match($("#speakers-heading + ul").text(), /David Wesst/);
  assert.match($("#speakers-heading + ul").text(), /Jackson Bruno/);
});

test("indexes, topics, compatibility pages, and standalone pages render", async () => {
  const authored = await inventory;
  const postCount = authored.articles.length + authored.gamelogs.length + authored.dungeonlogs.length;
  const blog = await page("blog/index.html");
  assert.equal(blog("h1").text(), "Blog");
  assert.equal(blog("ol > li").length, postCount);
  assert.match(blog("ol").attr("class"), /\bmd:grid-cols-1\b/);
  assert.match(blog("ol").attr("class"), /\blg:grid-cols-1\b/);
  assert.ok(blog("ol > li article figure").first().attr("class").split(/\s+/).includes("aspect-[32/9]"));
  const typeFilters = blog("[data-content-type-filter] input[type='checkbox']");
  assert.equal(typeFilters.length, 3);
  const postTypes = Object.keys(site.postTypes).filter((type) => type !== "talk").sort();
  assert.deepEqual(typeFilters.map((_, input) => blog(input).attr("value")).get(), postTypes);
  assert.ok(typeFilters.toArray().every((input) => blog(input).is("[checked]")));
  assert.equal(blog("#blog-post-list > li[data-content-type='article']").length, authored.articles.length);
  assert.equal(blog("#blog-post-list > li[data-content-type='gamelog']").length, authored.gamelogs.length);
  assert.equal(blog("#blog-post-list > li[data-content-type='dungeonlog']").length, authored.dungeonlogs.length);
  assert.match(
    blog("article:has(h2 a[href='/blog/paranormasight-the-mermaids-curse/']) .post-card-description").text(),
    /This is the second Paranormasight game/,
  );
  assert.match(blog("script").text(), /Showing 0 posts\? That's silly\./);

  assert.equal((await page("blog/articles/index.html"))("ol > li").length, authored.articles.length);
  assert.equal((await page("blog/gamelogs/index.html"))("ol > li").length, authored.gamelogs.length);
  assert.equal((await page("blog/dungeonlogs/index.html"))("ol > li").length, authored.dungeonlogs.length);

  const talks = await page("talks/index.html");
  const latestTalk = authored.talks.toSorted((left, right) => new Date(right.date) - new Date(left.date))[0];
  assert.equal(talks("ol > li").length, authored.talks.length);
  assert.equal(talks("ol > li").first().find("h2").text().trim(), latestTalk.title);
  assert.equal(talks("ol > li").first().find("time").attr("datetime"), new Date(latestTalk.date).toISOString());
  assert.match(talks("ol").attr("class"), /\bmd:grid-cols-1\b/);
  assert.match(talks("ol").attr("class"), /\blg:grid-cols-1\b/);
  assert.doesNotMatch(talks("ol").attr("class"), /\bmax-w-3xl\b/);
  assert.doesNotMatch(talks("ol").attr("class"), /\blg:grid-cols-2\b/);
  assert.doesNotMatch(talks("ol").attr("class"), /\blg:grid-cols-3\b/);
  assert.equal(talks("ol > li article figure").length, authored.talks.length);
  assert.ok(talks("ol > li article figure").first().attr("class").split(/\s+/).includes("aspect-[32/9]"));
  assert.equal(
    talks("article:has(h2 a[href='/talks/no-mission-impossible/']) figure img").attr("src"),
    "/talks/no-mission-impossible/Slide2.jpg",
  );

  const topic = await page("topics/eleventy/index.html");
  assert.equal(topic("h1").text().trim(), "eleventy");
  assert.ok(topic("ol > li").length > 0);

  const compatibility = await page("categories/eleventy/index.html");
  assert.equal(compatibility("meta[name=robots]").attr("content"), "noindex");
  assert.equal(compatibility("link[rel=canonical]").attr("href"), "https://david.wes.st/topics/eleventy/");
  assert.equal(compatibility("a[href='/topics/eleventy/']").length, 1);

  assert.equal((await page("about/index.html"))("h1").text(), "About");
  assert.equal((await page("projects/index.html"))("h1").text(), "Projects");
});

test("Azure redirects and the legacy query dispatcher are generated", async () => {
  const config = JSON.parse(await readFile(join(output, "staticwebapp.config.json"), "utf8"));
  assert.equal(config.trailingSlash, "auto");
  assert.ok(config.routes.some((route) => route.route === "/talks/concensus-in-the-chaos/" && route.statusCode === 301));
  assert.ok(config.routes.some((route) => route.route === "/blog/gamelog/entry.html" && route.rewrite === "/legacy/gamelog-entry.html"));
  assert.ok(config.routes.some((route) => route.route === "/blog/gamelog/clair-obscur-expedition-33/" && route.redirect === "/blog/clair-obscur-expedition-33/" && route.statusCode === 301));
  assert.ok(config.routes.some((route) => route.route === "/blog/dungeonlog/2026-03-16/" && route.redirect === "/blog/2026-03-16/" && route.statusCode === 301));
  assert.ok(config.routes.some((route) => route.route === "/blog/gamelog/" && route.redirect === "/blog/gamelogs/"));
  assert.ok(config.routes.some((route) => route.route === "/blog/dungeonlog/" && route.redirect === "/blog/dungeonlogs/"));

  const dispatcher = await readFile(join(output, "legacy", "gamelog-entry.html"), "utf8");
  assert.match(dispatcher, /URLSearchParams/);
  assert.match(dispatcher, /clair-obscur-expedition-33/);
  assert.match(dispatcher, /"clair-obscur-expedition-33":"\/blog\/clair-obscur-expedition-33\/"/);
  assert.match(dispatcher, /\/blog\/gamelogs\//);
  assert.match(dispatcher, /noindex/);
});

test("page metadata normalizes descriptions, canonical URLs, images, and schema", () => {
  const result = preparePageMetadata({ site: { title: "David Wesst", description: "Fallback", url: "https://david.wes.st", socialLinks: [] }, page: { url: "/blog/example/" }, title: "Example", summary: "**Useful** [summary](https://example.com).", type: "article", date: "2026-01-01", banner: { src: "./cover.png", alt: "Cover" } });
  assert.equal(result.description, "Useful summary.");
  assert.equal(result.canonicalUrl, "https://david.wes.st/blog/example/");
  assert.equal(result.imageUrl, "https://david.wes.st/blog/example/cover.png");
  assert.equal(result.openGraphType, "article");
  assert.equal(JSON.parse(result.jsonLd)["@graph"][0]["@type"], "BlogPosting");
});

test("page metadata derives a pre-render description from authored Markdown", () => {
  const result = preparePageMetadata({ site: { title: "David Wesst", description: "Fallback", url: "https://david.wes.st", socialLinks: [] }, page: { url: "/blog/example/", rawInput: "---\ntitle: Example\n---\nA **distinct** introduction without a summary." }, title: "Example", type: "gamelog" });
  assert.equal(result.description, "A distinct introduction without a summary.");
});

test("sitemap, robots, and feeds expose canonical content", async () => {
  const sitemap = await readFile(join(output, "sitemap.xml"), "utf8");
  assert.match(sitemap, /https:\/\/david\.wes\.st\/blog\/paranormasight-the-mermaids-curse\//);
  assert.match(sitemap, /https:\/\/david\.wes\.st\/blog\/articles\//);
  assert.match(sitemap, /https:\/\/david\.wes\.st\/topics\/eleventy\//);
  assert.doesNotMatch(sitemap, /\/categories\//);
  const robots = await readFile(join(output, "robots.txt"), "utf8");
  assert.match(robots, /Sitemap: https:\/\/david\.wes\.st\/sitemap\.xml/);
  for (const file of ["feed.xml", "blog/articles/feed.xml", "blog/gamelogs/feed.xml", "blog/dungeonlogs/feed.xml", "talks/feed.xml"]) {
    const feed = await readFile(join(output, file), "utf8");
    assert.match(feed, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/);
    assert.match(feed, /<author><name>David Wesst<\/name>/);
    assert.match(feed, new RegExp(`<id>https://david\\.wes\\.st/${file.replaceAll(".", "\\.")}</id>`));
  }
});

test("content navigation ranks topics and provides family sequence", () => {
  const items = [
    { url: "/older/", date: new Date("2024-01-01"), data: { type: "article", topics: ["web"] } },
    { url: "/current/", date: new Date("2025-01-01"), data: { type: "article", topics: ["web", "games"] } },
    { url: "/talk/", date: new Date("2026-01-01"), data: { type: "talk", topics: ["web", "games"] } },
    { url: "/newer/", date: new Date("2026-02-01"), data: { type: "article", topics: ["games"] } },
  ];
  const result = prepareContentNavigation(items, "/current/", "article", ["web", "games"]);
  assert.deepEqual(result.related.map((item) => item.url), ["/talk/", "/newer/", "/older/"]);
  assert.equal(result.previous.url, "/older/");
  assert.equal(result.next.url, "/newer/");
});

test("campaign links standardize supported sources", () => {
  assert.equal(campaignUrl("/blog/example/", "bluesky", "example"), "https://david.wes.st/blog/example/?utm_source=bluesky&utm_medium=social&utm_campaign=example");
  assert.throws(() => campaignUrl("https://example.com/post/", "youtube", "post"), /canonical published/);
  assert.throws(() => campaignUrl("/blog/example/", "discord", "example"), /Unsupported/);
  assert.throws(() => campaignUrl("/blog/example", "youtube", "example"), /canonical published/);
  assert.throws(() => campaignUrl("/sitemap.xml", "youtube", "sitemap"), /canonical published/);
  assert.throws(() => campaignUrl("/categories", "youtube", "categories"), /canonical published/);
});

test("detail sharing uses canonical untracked links with accessible fallbacks", async () => {
  const $ = await page("blog/from-11ty-to-wordpress-and-back-again/index.html");
  const share = $("[data-share-url]");
  assert.equal(share.attr("data-share-url"), "https://david.wes.st/blog/from-11ty-to-wordpress-and-back-again/");
  assert.equal(share.find("button.copy-share").length, 1);
  assert.equal(share.find("[aria-live='polite']").length, 1);
  assert.match(share.find("button.copy-share i").attr("class"), /fa-link/);
  assert.ok(share.find("i.fa-solid, i.fa-brands").length >= 5);
  const emailUrl = share.find("a[href^='mailto:']").attr("href");
  assert.equal(emailUrl, "mailto:?subject=From%2011ty%20to%20Wordpress%20and%20Back%20Again&body=https%3A%2F%2Fdavid.wes.st%2Fblog%2Ffrom-11ty-to-wordpress-and-back-again%2F");
  assert.doesNotMatch(emailUrl, /document|querySelector|navigator/);
  assert.match($.html(), /execCommand\(["']copy["']\)/);
  assert.equal(share.find(".copy-share-label").text(), "Copy link");
  assert.doesNotMatch(share.html(), /utm_/);
});
