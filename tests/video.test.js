import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, copyFile, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import matter from "gray-matter";
import sharp from "sharp";
import { load } from "cheerio";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { normalizeYoutube, normalizeVideoLinks } from "../lib/video.js";
import { fetchYoutubeMetadata } from "../lib/youtube-metadata.js";
import { createVideo, parseVideoArguments } from "../tools/new-content.mjs";

const id = "EAB4uFQN6LE";
const youtube = `https://www.youtube.com/watch?v=${id}`;

test("YouTube URLs normalize without tracking, playlist context, or arbitrary hosts", () => {
  for (const url of [youtube + "&list=ignored&si=tracking", `https://youtu.be/${id}`, `https://youtube.com/shorts/${id}`, `https://www.youtube.com/embed/${id}`]) {
    assert.deepEqual(normalizeYoutube(url), { id, url: youtube, embedUrl: `https://www.youtube.com/embed/${id}` });
  }
  for (const url of ["bad", "https://youtube.com/playlist?list=abc", "https://youtube.com/watch?v=bad", `https://youtube.com.evil.invalid/watch?v=${id}`, `https://user@youtube.com/watch?v=${id}`, `ftp://youtu.be/${id}`]) assert.throws(() => normalizeYoutube(url));
});

test("supplementary links retain order and labels as data while rejecting unsafe destinations", () => {
  const links = [{ label: " <script>alert(1)</script> ", url: "/blog/example/" }, { label: "Discussion", url: "https://www.linkedin.com/posts/example" }];
  assert.deepEqual(normalizeVideoLinks(links), [{ ...links[0], label: links[0].label.trim() }, links[1]]);
  for (const url of ["javascript:alert(1)", "//evil.invalid", "/\\evil.invalid", "relative/path", "http://example.com", "https://user:pass@example.com", "/\nevil"]) assert.throws(() => normalizeVideoLinks([{ label: "Bad", url }]));
  assert.throws(() => normalizeVideoLinks([{ label: "", url: "/" }]));
  assert.throws(() => normalizeVideoLinks({}));
});

test("components escape supplementary labels and provide an accessible video placeholder", async () => {
  const require = createRequire(import.meta.resolve("@11ty/eleventy-plugin-webc"));
  const { WebC } = await import(pathToFileURL(require.resolve("@11ty/webc")).href);
  const links = new WebC();
  links.setInputPath("src/_includes/components/video-links.webc");
  const result = await links.compile({ data: { links: [{ label: '<script>alert("x")</script>', url: "/blog/" }] } });
  const $ = load(result.html);
  assert.equal($("script").length, 0);
  assert.equal($("a").text(), '<script>alert("x")</script>');
  const visual = new WebC();
  visual.setInputPath("src/_includes/components/post-visual.webc");
  const site = (await import("../src/_data/site.js")).default;
  const placeholder = load((await visual.compile({ data: { banner: null, type: "video", site, featured: false, cropped: false } })).html);
  assert.equal(placeholder("[role=img]").attr("aria-label"), "Video placeholder image");
  assert.equal(placeholder("img").length, 0);
});

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "website-video-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "templates/video"), { recursive: true });
  await copyFile("templates/video/index.md", path.join(root, "templates/video/index.md"));
  return root;
}

test("offline video authoring preserves capitalization, escapes YAML and refuses collisions", async (t) => {
  const root = await fixture(t);
  const result = await createVideo('API: "YouTube" & YAML', { root, youtube, date: new Date("2026-10-21") });
  const { data, content } = matter(await readFile(result.destination, "utf8"));
  assert.equal(data.title, 'API: "YouTube" & YAML');
  assert.equal(data.youtube, youtube);
  assert.equal(data.date.toISOString(), "2026-10-21T00:00:00.000Z");
  assert.equal(data.banner, undefined);
  assert.equal(data.summary, "");
  assert.match(content, /Optional/);
  await assert.rejects(createVideo('API: "YouTube" & YAML', { root, youtube }), /already exists/);
  await assert.rejects(createVideo("videos", { root, youtube }), /reserved/);
  await mkdir(path.join(root, "src/content/posts/articles/article-slug"), { recursive: true });
  await assert.rejects(createVideo("article slug", { root, youtube }), /already exists/);
  const literal = await createVideo("Literal $& {{ summary }}", { root, youtube });
  assert.equal(matter(await readFile(literal.destination, "utf8")).data.title, "Literal $& {{ summary }}");
});

test("CLI video options validate dates and preserve the explicit title", () => {
  const parsed = parseVideoArguments(["My API", "video", "--youtube", youtube, "--date", "2026-10-21", "--fetch-youtube"]);
  assert.equal(parsed.name, "My API video");
  assert.equal(parsed.options.fetchYoutube, true);
  for (const args of [["--date", "2026-02-30"], ["--youtube"], ["--wat"]]) assert.throws(() => parseVideoArguments(args));
});

async function apiFixture() {
  const bytes = await sharp({ create: { width: 32, height: 18, channels: 3, background: "red" } }).png().toBuffer();
  const fetch = async (url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    if (String(url).startsWith("https://i.ytimg.com/")) return new Response(bytes);
    return Response.json({ items: [{ id, snippet: { title: 'API "title"', publishedAt: "2026-10-20T12:30:00Z", description: "First paragraph.\nStill first.\n\nSecond paragraph.", thumbnails: { high: { url: "https://i.ytimg.com/vi/example/hqdefault.jpg" } } } }] });
  };
  return { fetch, bytes };
}

test("enriched authoring saves a decoded local image and imports only draft metadata", async (t) => {
  const root = await fixture(t);
  const { fetch, bytes } = await apiFixture();
  const result = await createVideo(undefined, { root, youtube, fetchYoutube: true, apiKey: "test-key", fetch });
  const { data } = matter(await readFile(result.destination, "utf8"));
  assert.equal(data.title, 'API "title"');
  assert.equal(data.date.toISOString(), "2026-10-20T00:00:00.000Z");
  assert.equal(data.summary, "First paragraph. Still first.");
  assert.deepEqual(data.topics, []);
  assert.equal(data.links, undefined);
  assert.equal(data.banner.src, "./thumbnail.png");
  assert.deepEqual(await readFile(path.join(path.dirname(result.destination), "thumbnail.png")), bytes);
  const override = await createVideo("Explicit title", { root, youtube, fetchYoutube: true, apiKey: "test-key", fetch, date: new Date("2026-10-25") });
  const overridden = matter(await readFile(override.destination, "utf8")).data;
  assert.equal(overridden.title, "Explicit title");
  assert.equal(overridden.date.toISOString(), "2026-10-25T00:00:00.000Z");
});

test("thumbnail failure warns without blocking a valid post", async (t) => {
  const root = await fixture(t);
  const { fetch } = await apiFixture();
  const result = await createVideo("No thumbnail", { root, youtube, fetchYoutube: true, apiKey: "test-key", fetch: (url, options) => String(url).startsWith("https://i.ytimg.com/") ? Promise.resolve(new Response("not an image")) : fetch(url, options) });
  assert.equal(result.warnings.length, 1);
  assert.equal(matter(await readFile(result.destination, "utf8")).data.banner, undefined);
});

test("metadata failures write no post and never disclose request secrets", async (t) => {
  const root = await fixture(t);
  for (const options of [
    { apiKey: "" },
    { apiKey: "secret-test-key", fetch: async () => { throw new Error("timeout secret-test-key"); } },
    { apiKey: "secret-test-key", fetch: async () => new Response("", { status: 403 }) },
    { apiKey: "secret-test-key", fetch: async () => Response.json({ items: [] }) },
  ]) {
    await assert.rejects(createVideo("Failed", { root, youtube, fetchYoutube: true, ...options }), (error) => {
      assert.doesNotMatch(error.message, /secret-test-key/);
      return true;
    });
  }
  assert.deepEqual(await readdir(root), ["templates"]);
  await assert.rejects(fetchYoutubeMetadata(youtube, { apiKey: "x", timeoutMs: 5, fetch: (_url, { signal }) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(Response.json({ items: [] })), 100);
    signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); });
  }) }), /lookup failed/);
});

test("video pages preserve routes and render one player, local thumbnails, and companion links", async () => {
  const html = load(await readFile("_site/blog/is-scalable-game-design-a-thing/index.html", "utf8"));
  assert.equal(html("main iframe").length, 1);
  assert.equal(html("main iframe").attr("src"), "https://www.youtube.com/embed/VKzO3YvJ_Jg");
  assert.ok(html("main iframe").attr("title"));
  assert.equal(html("main > article > div .post-visual").length, 0);
  assert.equal(html("link[rel=canonical]").attr("href"), "https://david.wes.st/blog/is-scalable-game-design-a-thing/");
  const video = load(await readFile("_site/blog/defining-video-game-scope-video/index.html", "utf8"));
  assert.equal(video("#video-links-heading").text(), "Related links");
  assert.equal(video("a[href='/blog/defining-video-game-scope-with-documentation/']").length > 0, true);
  const article = load(await readFile("_site/blog/defining-video-game-scope-with-documentation/index.html", "utf8"));
  assert.equal(article("main iframe").length, 0);
  assert.ok(article("a[href='/blog/defining-video-game-scope-video/']").length);
  assert.ok(article("a[href='https://youtu.be/EAB4uFQN6LE']").length);
  const archive = load(await readFile("_site/blog/videos/index.html", "utf8"));
  assert.equal(archive("main section ol > li").length, 2);
  assert.equal(archive("img[src^='https://']").length, 0);
  const feed = await readFile("_site/blog/videos/feed.xml", "utf8");
  assert.match(feed, /defining-video-game-scope-video/);
  const sitemap = await readFile("_site/sitemap.xml", "utf8");
  assert.match(sitemap, /blog\/videos\//);
});
