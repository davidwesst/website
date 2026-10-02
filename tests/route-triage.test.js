import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { siteLinkUrl } from "../lib/site-links.js";
import { classifyRoute, triageRoutes, triageCsv } from "../lib/route-triage.js";
import { repairLegacyBodyLinks } from "../lib/legacy-route-repairs.js";
import { CONFIRMED_REDIRECT_REPAIRS } from "../lib/legacy-route-repairs.js";

test("link validation includes absolute former-host links and relative resources", () => {
  assert.equal(siteLinkUrl("http://www.davidwesst.com/talks/cots-to-cloud/?from=post#slides", "/blog/example/").pathname, "/talks/cots-to-cloud/");
  assert.equal(siteLinkUrl("./banner.jpg", "/blog/example/").pathname, "/blog/example/banner.jpg");
  assert.equal(siteLinkUrl("", "/blog/example/").pathname, "/blog/example/");
  assert.equal(siteLinkUrl("//david.wes.st/blog/", "/").pathname, "/blog/");
  for (const reference of ["https://example.com/blog/", "https://davidwesst.com.example.com/blog/", "mailto:owner@example.com", "data:image/png;base64,abc"]) {
    assert.equal(siteLinkUrl(reference, "/"), undefined);
  }
});

test("built pages emit canonical links and correct YouTube embeds after repair", () => {
  const oldPaths = new Set(CONFIRMED_REDIRECT_REPAIRS.map(([source]) => source));
  for (const entry of readdirSync("_site", { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".html"))) {
    const file = path.join(entry.parentPath, entry.name);
    const page = `/${path.relative("_site", file).replaceAll("\\", "/").replace(/index\.html$/, "")}`;
    const $ = load(readFileSync(file, "utf8"));
    for (const element of $("a[href], iframe[src]").toArray()) {
      const href = $(element).attr("href") ?? $(element).attr("src");
      const url = siteLinkUrl(href, page);
      if (url) assert.ok(!oldPaths.has(url.pathname), `${page} still emits ${href}`);
      assert.doesNotMatch(href, /davidwesst\.com\/\/www\.youtube\.com/);
    }
  }
  for (const [slug, id] of [["get-to-the-point-my-pilot-video", "M5OQchl9bQA"], ["hypertext-gaming-starting-june-29th-on-twitch", "-nbC9Pvykv8"], ["javascript-coding-is-gameplay-in-screeps", "pAfPqxzyBIc"]]) {
    const $ = load(readFileSync(`_site/blog/${slug}/index.html`, "utf8"));
    assert.equal($(`iframe[src='https://www.youtube.com/embed/${id}']`).length, 1);
  }
});

test("migration repairs known links and malformed embeds while preserving other URLs", () => {
  assert.equal(repairLegacyBodyLinks('[talk](https://davidwesst.com/talks/cots-to-cloud/?from=blog#slides)'), '[talk](/talks/from-custom-cots-to-cloud/?from=blog#slides)');
  assert.equal(repairLegacyBodyLinks('<iframe src="http://www.davidwesst.com//www.youtube.com/embed/M5OQchl9bQA"></iframe>'), '<iframe src="https://www.youtube.com/embed/M5OQchl9bQA"></iframe>');
  const untouched = '[http://davidwesst.com](http://davidwesst.com) [other](https://davidwesst.com/unknown/)';
  assert.equal(repairLegacyBodyLinks(untouched), untouched);
  const foreign = "https://davidwesst.com.example.com/talks/cots-to-cloud/";
  assert.equal(repairLegacyBodyLinks(foreign), foreign);
});

test("classification keeps probes, excluded favicon, and unresolved cases out of confirmed repairs", () => {
  assert.equal(classifyRoute("/wp/").classification, "scanner-like");
  assert.equal(classifyRoute("/app/.env.production").classification, "scanner-like");
  assert.equal(classifyRoute("/.git/config").classification, "scanner-like");
  assert.equal(classifyRoute("/favicon.ico").classification, "excluded-favicon-56");
  assert.equal(classifyRoute("/rss").classification, "unresolved");
  assert.equal(classifyRoute("/tags/unknown/").target, null);
  assert.equal(classifyRoute("/blog/feed.xml").target, "/blog/articles/feed.xml");
  assert.equal(classifyRoute("/topics/wordpress/", { published: new Set(["/topics/wordpress/"]) }).classification, "currently-published");
});

test("subsequent requests and generated referrers remain separate; CSV escapes evidence", () => {
  const rows = triageRoutes([{ path: "/rss", count: 19 }, { path: "/talks/cots-to-cloud/", count: 14 }], { references: new Map([["/rss", ["/blog/example/"]]]) }, [{ path: "/talks/cots-to-cloud/", count: 2 }]);
  assert.deepEqual(rows[0].generatedReferrers, ["/blog/example/"]);
  assert.equal(rows[1].subsequentCount, 2);
  assert.deepEqual(rows[1].generatedReferrers, []);
  assert.match(triageCsv([{ ...rows[0], evidence: 'A "quoted", value' }]), /"A ""quoted"", value"/);
  const scoped = triageRoutes([{ path: "/rss", count: 19 }, { path: "/talks/cots-to-cloud/", count: 14 }], { references: new Map() }, [], new Set(["/talks/cots-to-cloud/"]));
  assert.equal(scoped[0].subsequentCount, null, "Unqueried paths must not appear to have zero traffic");
  assert.equal(scoped[1].subsequentCount, 0, "An empty complete scoped capture does establish zero requests");
});
