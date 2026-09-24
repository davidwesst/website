import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { hostingRoutes, cloudflareRedirects } from "../lib/hosting-routes.js";

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
