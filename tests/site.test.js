import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { load } from "cheerio";
import { getPostDescription, prepareHomeContent } from "../src/_lib/home-content.js";

const output = join(process.cwd(), "_site");

async function page(relativePath) {
  return load(await readFile(join(output, relativePath), "utf8"));
}

test("the home page renders the Ghostwind shell and configured content", async () => {
  const $ = await page("index.html");
  assert.equal($("h1").text(), "David Wesst");
  assert.equal($("link[rel=stylesheet][href='/assets/main.css']").length, 1);
  assert.equal($("link[href='/assets/fontawesome.css']").length, 1);
  assert.match($("body").attr("class"), /bg-slate-100/);
  assert.equal($("nav[aria-label='Primary navigation'] a").length, 7);
  assert.equal($("nav[aria-label='Primary navigation'] a[href='/topics/']").text(), "Topics");
  assert.equal($("#featured-heading + article h2").text().trim(), "Paranormasight: The Mermaid's Curse");
  assert.match($("#featured-heading + article .post-card-description").text(), /This is the second Paranormasight game/);
  assert.match($("#recent-heading").closest("section").find("ol > li article time").first().closest("footer").attr("class"), /\bmt-auto\b/);
  assert.match($("#recent-heading").closest("section").find("ol > li article time").first().closest("footer").attr("class"), /\bpt-6\b/);
  assert.equal($("#recent-heading").closest("section").find("ol > li").length, 9);
  assert.equal($("#explore-heading").closest("section").find("ul > li").length, 2);
  const heroSocialLinks = $("header ul[aria-label='Social links'] a");
  const footerSocialLinks = $("footer ul[aria-label='Social links'] a");
  assert.equal(heroSocialLinks.length, 3);
  assert.equal(footerSocialLinks.length, 3);
  assert.deepEqual(heroSocialLinks.map((_, link) => $(link).text().trim()).get(), ["GitHub", "LinkedIn", "YouTube"]);
  assert.deepEqual(footerSocialLinks.map((_, link) => $(link).text().trim()).get(), ["GitHub", "LinkedIn", "YouTube"]);
  assert.match(heroSocialLinks.first().find("i").attr("class"), /fa-github/);
  assert.match(footerSocialLinks.first().find("i").attr("class"), /fa-github/);
  assert.equal($("footer a[href='https://github.com/tailwindtoolbox/Ghostwind/']").text(), "Ghostwind");
  assert.equal($("footer a[href='https://www.11ty.dev/']").text(), "Build Awesome / 11ty");
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
});

test("representative post types render normalized data", async () => {
  const article = await page("blog/from-11ty-to-wordpress-and-back-again/index.html");
  assert.equal(article("h1").text(), "From 11ty to Wordpress and Back Again");
  assert.equal(article("time").first().attr("datetime"), "2025-01-30");
  assert.equal(article("figure img").attr("src"), "./from-11ty-to-wordpress-and-back-again_title-image.webp");

  const gamelog = await page("blog/clair-obscur-expedition-33/index.html");
  assert.match(gamelog("dl").text(), /XBox Series X/);
  assert.match(gamelog("dl").text(), /overall\s*3/);

  const julyGamelog = await page("blog/paranormasight-the-mermaids-curse/index.html");
  assert.equal(julyGamelog("h1").text(), "Paranormasight: The Mermaid's Curse");
  assert.equal(julyGamelog("time").first().attr("datetime"), "2026-07-23");
  assert.match(julyGamelog("dl").text(), /overall\s*2/);

  const dungeonlog = await page("blog/2026-03-16/index.html");
  assert.equal(dungeonlog("h1").text(), "The Queen Who Refused to Die");
  assert.ok(dungeonlog("figure img").length);
});

test("post visuals use banners or accessible type-specific fallbacks", async () => {
  const article = await page("blog/i-miss-blogging/index.html");
  assert.equal(article("figure [role=img]").attr("aria-label"), "Article placeholder image");
  assert.match(article("figure [role=img] i").attr("class"), /fa-newspaper/);

  const gamelog = await page("blog/the-ratline/index.html");
  assert.equal(gamelog("figure [role=img]").attr("aria-label"), "Gamelog placeholder image");
  assert.match(gamelog("figure [role=img] i").attr("class"), /fa-gamepad/);

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
  const blog = await page("blog/index.html");
  assert.equal(blog("h1").text(), "Blog");
  assert.equal(blog("ol > li").length, 169);
  assert.match(blog("ol").attr("class"), /\bmd:grid-cols-1\b/);
  assert.match(blog("ol").attr("class"), /\blg:grid-cols-1\b/);
  assert.ok(blog("ol > li article figure").first().attr("class").split(/\s+/).includes("aspect-[32/9]"));
  const typeFilters = blog("[data-content-type-filter] input[type='checkbox']");
  assert.equal(typeFilters.length, 3);
  assert.deepEqual(typeFilters.map((_, input) => blog(input).attr("value")).get(), ["article", "dungeonlog", "gamelog"]);
  assert.ok(typeFilters.toArray().every((input) => blog(input).is("[checked]")));
  assert.equal(blog("#blog-post-list > li[data-content-type='article']").length, 138);
  assert.equal(blog("#blog-post-list > li[data-content-type='gamelog']").length, 19);
  assert.equal(blog("#blog-post-list > li[data-content-type='dungeonlog']").length, 12);
  assert.match(blog("script").text(), /Showing 0 posts\? That's silly\./);

  assert.equal((await page("blog/articles/index.html"))("ol > li").length, 138);
  assert.equal((await page("blog/gamelogs/index.html"))("ol > li").length, 19);
  assert.equal((await page("blog/dungeonlogs/index.html"))("ol > li").length, 12);

  const talks = await page("talks/index.html");
  assert.equal(talks("ol > li").length, 12);
  assert.equal(talks("ol > li").first().find("h2").text().trim(), "A Guide to SaaS-Ready Banner Customizations in 2026");
  assert.equal(talks("ol > li").first().find("time").attr("datetime"), "2026-06-01T00:00:00.000Z");
  assert.match(talks("ol").attr("class"), /\bmd:grid-cols-1\b/);
  assert.match(talks("ol").attr("class"), /\blg:grid-cols-1\b/);
  assert.doesNotMatch(talks("ol").attr("class"), /\bmax-w-3xl\b/);
  assert.doesNotMatch(talks("ol").attr("class"), /\blg:grid-cols-2\b/);
  assert.doesNotMatch(talks("ol").attr("class"), /\blg:grid-cols-3\b/);
  assert.equal(talks("ol > li article figure img").length, 12);
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
  assert.equal(config.trailingSlash, "always");
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
