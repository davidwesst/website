import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { load } from "cheerio";

const output = join(process.cwd(), "_site");

async function page(relativePath) {
  return load(await readFile(join(output, relativePath), "utf8"));
}

test("the home page retains the base site shell", async () => {
  const $ = await page("index.html");
  assert.equal($("h1").text(), "David Wesst");
  assert.equal($("link[rel=stylesheet]").attr("href"), "/assets/main.css");
  assert.match($("body").attr("class"), /bg-black/);
  assert.match($("body").attr("class"), /text-white/);
  assert.equal($("nav[aria-label='Primary navigation'] a").length, 6);
});

test("representative post types render normalized data", async () => {
  const article = await page("blog/from-11ty-to-wordpress-and-back-again/index.html");
  assert.equal(article("h1").text(), "From 11ty to Wordpress and Back Again");
  assert.equal(article("time").first().attr("datetime"), "2025-01-30");
  assert.equal(article("figure img").attr("src"), "./from-11ty-to-wordpress-and-back-again_title-image.webp");

  const gamelog = await page("blog/clair-obscur-expedition-33/index.html");
  assert.match(gamelog("dl").text(), /XBox Series X/);
  assert.match(gamelog("dl").text(), /overall\s*3/);

  const dungeonlog = await page("blog/2026-03-16/index.html");
  assert.equal(dungeonlog("h1").text(), "The Queen Who Refused to Die");
  assert.ok(dungeonlog("figure img").length);
});

test("talks render publication and appearance dates separately", async () => {
  const $ = await page("talks/no-mission-impossible/index.html");
  assert.equal($("header time").first().attr("datetime"), "2026-08-05");
  assert.equal($("#appearances-heading + ol > li").length, 1);
  assert.equal($("#appearances-heading + ol time").first().attr("datetime"), "2024-04-07");
  assert.match($("#speakers-heading + ul").text(), /David Wesst/);
  assert.match($("#speakers-heading + ul").text(), /Jackson Bruno/);
});

test("indexes, categories, and standalone pages render", async () => {
  const blog = await page("blog/index.html");
  assert.equal(blog("h1").text(), "Blog");
  assert.equal(blog("ol > li").length, 166);

  assert.equal((await page("blog/articles/index.html"))("ol > li").length, 138);
  assert.equal((await page("blog/gamelogs/index.html"))("ol > li").length, 16);
  assert.equal((await page("blog/dungeonlogs/index.html"))("ol > li").length, 12);

  const talks = await page("talks/index.html");
  assert.equal(talks("ol > li").length, 12);

  const category = await page("categories/eleventy/index.html");
  assert.match(category("h1").text(), /Category:\s*eleventy/);
  assert.ok(category("ol > li").length > 0);

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
