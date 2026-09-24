import assert from "node:assert/strict";

const base = process.argv[2];
assert.ok(base, "Provide the deployed site URL");
const origin = new URL(base).origin;
const request = (route) => fetch(`${origin}${route}`, { redirect: "manual", signal: AbortSignal.timeout(20000) });
for (const route of ["/", "/blog/", "/talks/", "/about/", "/feed.xml", "/sitemap.xml", "/assets/main.css"]) {
  const response = await request(route);
  assert.equal(response.status, 200, `${route} should return 200`);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff", `${route} security header`);
}
for (const [source, target] of [["/blog.html", "/blog/"], ["/blog/gamelog/", "/blog/gamelogs/"], ["/blog/dungeonlog/", "/blog/dungeonlogs/"]]) {
  const response = await request(`${source}?migration=check`);
  assert.equal(response.status, 301, `${source} must be permanent`);
  const location = new URL(response.headers.get("location"), origin);
  assert.equal(location.pathname, target);
  assert.equal(location.searchParams.get("migration"), "check", `${source} must retain query parameters`);
}
const legacy = await fetch(`${origin}/blog/gamelog/entry.html?slug=clair-obscur-expedition-33`, { signal: AbortSignal.timeout(20000) });
assert.equal(legacy.status, 200);
assert.equal(new URL(legacy.url).searchParams.get("slug"), "clair-obscur-expedition-33");
assert.match(await legacy.text(), /URLSearchParams/);
assert.equal((await request("/migration-missing-page-93a10/")).status, 404);
const home = await (await request("/")).text();
assert.doesNotMatch(home, /application-insights\.js|static\.cloudflareinsights\.com|sentry/i);
console.log(`Hosting checks passed: ${origin}`);
