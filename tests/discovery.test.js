import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { load } from "cheerio";
import { canonicalItems, reliableModified } from "../src/_lib/discovery-documents.js";
import { sitemapUrls } from "../lib/indexnow.js";
import indexnow from "../src/_data/indexnow.js";
import { preparePageMetadata } from "../src/_lib/page-metadata.js";
import site from "../src/_data/site.js";
const origin = "https://david.wes.st";
const readPage = async (route) => load(await readFile(path.join("_site", route, "index.html"), "utf8"));

test("JSON-LD escapes closing script markup while preserving the authored title", () => {
  const title = "An example </script><script>alert(1)</script>";
  const metadata = preparePageMetadata({ site, title, page: { url: "/blog/example/" }, type: "article" });
  assert.ok(!metadata.jsonLd.includes("<"));
  assert.equal(JSON.parse(metadata.jsonLd)["@graph"][0].headline, title);
});

test("sitemap dates come from authored metadata, never inferred file dates", () => {
  assert.equal(reliableModified({ date: new Date(), data: { page: { rawInput: "---\ntitle: Static\n---\nBody" }, date: new Date() } }), null);
  assert.equal(reliableModified({ data: { date: "2020-01-01", updated: "2022-01-01" } }), "2022-01-01T00:00:00.000Z");
  assert.deepEqual(canonicalItems([{ url: "/good/" }, { url: "/good/" }, { url: "/categories/old/" }, { url: "/no/", data: { robots: "noindex" } }, { url: "/feed.xml" }]).map((item) => item.url), ["/good/"]);
});
test("canonical pages are reachable through visible links from the home page", async () => {
  const urls = sitemapUrls(await readFile("_site/sitemap.xml", "utf8"), origin);
  const remaining = new Set(urls);
  const queue = [origin + "/"];
  while (queue.length) {
    const url = queue.shift();
    if (!remaining.delete(url)) continue;
    const $ = await readPage(new URL(url).pathname);
    for (const a of $("body a[href]").toArray()) {
      const href = new URL($(a).attr("href"), url);
      href.search = ""; href.hash = "";
      if (remaining.has(href.href)) queue.push(href.href);
    }
  }
  assert.deepEqual([...remaining], [], "Every canonical page must have a crawlable path from home");
});
test("devlog and studio pathways, authorship and profile schema are consistent", async () => {
  for (const route of ["/", "/about/", "/projects/", "/topics/devlog/", "/blog/jan-2020-devlog/"]) {
    const $ = await readPage(route);
    assert.ok($('body a[href="/topics/devlog/"]').length, route);
    if (route !== "/") assert.ok($('body a[href="https://cocobokostudios.com"]').length, route);
    const graph = JSON.parse($('script[type="application/ld+json"]').text())["@graph"];
    const person = graph.find((item) => item["@type"] === "Person");
    assert.equal(person["@id"], origin + "/#person");
    assert.equal(graph[0].author["@id"], person["@id"]);
    if (route === "/about/") { assert.equal(graph[0]["@type"], "ProfilePage"); assert.equal(graph[0].mainEntity["@id"], person["@id"]); }
    if (route.includes("/blog/")) assert.equal($('a[rel="author"]').text(), "David Wesst");
    const breadcrumbs = graph.find((item) => item["@type"] === "BreadcrumbList");
    if (breadcrumbs) assert.equal($('nav[aria-label="Breadcrumb"] a').length, breadcrumbs.itemListElement.length);
  }
});
test("IndexNow manifest and ownership file exactly match the canonical sitemap", async () => {
  const urls = sitemapUrls(await readFile("_site/sitemap.xml", "utf8"), origin);
  const manifest = JSON.parse(await readFile("_site/indexnow-manifest.json", "utf8"));
  assert.deepEqual(Object.keys(manifest.pages), urls);
  assert.ok(Object.values(manifest.pages).every((hash) => /^[a-f0-9]{64}$/.test(hash)));
  assert.equal((await readFile(`_site/${indexnow.key}.txt`, "utf8")).trim(), indexnow.key);
  const $ = load(await readFile("_site/sitemap.xml", "utf8"), { xmlMode: true });
  assert.equal($('url').filter((_, element) => $(element).find("loc").text() === origin + "/about/").find("lastmod").length, 0);
  assert.match(await readFile("_site/_headers", "utf8"), /workers\.dev\/\*\n  X-Robots-Tag: noindex/);
});
