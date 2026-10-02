import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { hostingRoutes, cloudflareRedirects } from "../lib/hosting-routes.js";
import { CONFIRMED_REDIRECT_REPAIRS } from "../lib/legacy-route-repairs.js";

test("route model preserves explicit index redirects, skips query routes, and deduplicates", () => {
  const items = [{ url: "/blog/example/", data: { redirectFrom: ["/old/", "/old/", "/blog/example/index.html", "/blog/example/", "/entry?slug=example"] } }];
  const routes = hostingRoutes(items);
  assert.equal(routes.filter(r => r.route === "/old/").length, 1);
  assert.ok(routes.some(r => r.route === "/blog/example/index.html" && r.statusCode === 301));
  assert.ok(!routes.some(r => r.route.includes("?")));
  assert.doesNotMatch(cloudflareRedirects(routes), /\/blog\/gamelog\/entry\.html/);
});

test("conflicting destinations fail rather than silently changing legacy links", () => {
  assert.throws(() => hostingRoutes([
    { url: "/one/", data: { redirectFrom: ["/old/"] } },
    { url: "/two/", data: { redirectFrom: ["/old/"] } },
  ]), /Conflicting redirect/);
});

test("Cloudflare redirect limits fail before deployment", () => {
  assert.throws(() => cloudflareRedirects(Array.from({ length: 2001 }, (_, i) => ({ route: `/${i}`, redirect: "/", statusCode: 301 }))), /limit/);
  assert.throws(() => cloudflareRedirects([{ route: `/${"a".repeat(1000)}`, redirect: "/", statusCode: 301 }]), /limit/);
});

test("built Cloudflare routes preserve every Azure rollback rule", async () => {
  const azure = JSON.parse(await readFile("_site/staticwebapp.config.json", "utf8"));
  const lines = (await readFile("_site/_redirects", "utf8")).trim().split("\n");
  for (const route of azure.routes) {
    assert.ok(lines.includes(`${route.route} ${route.redirect} ${route.statusCode}`), route.route);
  }
  const headers = await readFile("_site/_headers", "utf8");
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Cache-Control: public, max-age=0, must-revalidate/);
});

test("confirmed route repairs are direct permanent redirects to published destinations", async () => {
  const lines = (await readFile("_site/_redirects", "utf8")).trim().split("\n").map((line) => line.split(" "));
  const sources = new Set(lines.map(([source]) => source));
  assert.equal(sources.size, lines.length, "Redirect sources must be unique");
  for (const [source, target] of CONFIRMED_REDIRECT_REPAIRS) {
    assert.ok(lines.some(([from, to, status]) => from === source && to === target && status === "301"), source);
    assert.ok(!sources.has(target), `${source} must not create a redirect chain`);
    const file = `_site${target}${target.endsWith("/") ? "index.html" : ""}`;
    assert.ok((await readFile(file)).length > 0, `${source} must have a real target`);
  }
  for (const [source] of lines) {
    if (!source.endsWith("/")) continue;
    await assert.rejects(readFile(`_site${source}index.html`), { code: "ENOENT" }, `${source} must not shadow a published page`);
  }
  assert.ok(!sources.has("/wp/"));
  assert.ok(!sources.has("/rss"), "Unconfirmed feed guesses must retain 404s");
  assert.ok(!sources.has("/tags/no-such-topic/"));
});

test("legacy feeds keep their original article, gamelog, and dungeonlog families", async () => {
  const redirects = await readFile("_site/_redirects", "utf8");
  for (const [source, target] of [["/blog/feed.xml", "/blog/articles/feed.xml"], ["/blog/gamelog/feed.xml", "/blog/gamelogs/feed.xml"], ["/blog/dungeonlog/feed.xml", "/blog/dungeonlogs/feed.xml"]]) {
    assert.ok(redirects.split("\n").includes(`${source} ${target} 301`), source);
  }
});
