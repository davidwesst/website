import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONFIRMED_REDIRECT_REPAIRS } from "../lib/legacy-route-repairs.js";

const base = process.argv[2];
assert.ok(base, "Provide the deployed site URL");
const origin = new URL(base).origin;
const telemetryExpected = process.env.EXPECT_TELEMETRY === "true";
const request = (route) => fetch(`${origin}${route}`, { redirect: "manual", signal: AbortSignal.timeout(20000) });

async function waitForDeployment() {
  let lastStatus = "unreachable";
  for (let attempt = 0; attempt < 13; attempt += 1) {
    try {
      const response = await request("/");
      if (response.status === 200) return response;
      lastStatus = `HTTP ${response.status}`;
    } catch (error) {
      lastStatus = error.message;
    }
    if (attempt < 12) await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  assert.fail(`Deployment did not become ready within 60 seconds: ${lastStatus}`);
}

const readyHome = await waitForDeployment();
for (const route of ["/", "/blog/", "/talks/", "/about/", "/feed.xml", "/sitemap.xml", "/assets/main.css", "/favicon.ico"]) {
  const response = route === "/" ? readyHome : await request(route);
  assert.equal(response.status, 200, `${route} should return 200`);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff", `${route} security header`);
  if (route === "/favicon.ico") {
    assert.match(response.headers.get("content-type") || "", /^image\/(?:x-icon|vnd\.microsoft\.icon)(?:;|$)/i, "Favicon Content-Type");
    const icon = Buffer.from(await response.arrayBuffer());
    assert.ok(icon.length >= 6, "Favicon must have an ICO header");
    assert.equal(icon.readUInt32LE(0), 0x00010000, "Favicon must be an ICO image");
    assert.ok(icon.readUInt16LE(4) > 0, "Favicon must contain an image");
  }
}
const redirectsToCheck = process.argv.includes("--all-redirects")
  ? readFileSync("_site/_redirects", "utf8").trim().split("\n").map((line) => line.split(" ").slice(0, 2))
  : [["/blog.html", "/blog/"], ["/blog/gamelog/", "/blog/gamelogs/"], ["/blog/dungeonlog/", "/blog/dungeonlogs/"], ...CONFIRMED_REDIRECT_REPAIRS];
for (const [source, target] of redirectsToCheck) {
  const response = await request(`${source}?migration=check`);
  assert.equal(response.status, 301, `${source} must be permanent`);
  const location = new URL(response.headers.get("location"), origin);
  assert.equal(location.pathname, target);
  assert.equal(location.searchParams.get("migration"), "check", `${source} must retain query parameters`);
  assert.equal(location.origin, origin, `${source} must redirect within the site`);
  assert.equal((await request(target)).status, 200, `${source} destination must be published`);
}
const legacy = await fetch(`${origin}/blog/gamelog/entry.html?slug=clair-obscur-expedition-33`, { signal: AbortSignal.timeout(20000) });
assert.equal(legacy.status, 200);
assert.equal(new URL(legacy.url).searchParams.get("slug"), "clair-obscur-expedition-33");
assert.match(await legacy.text(), /URLSearchParams/);
assert.equal((await request("/migration-missing-page-93a10/")).status, 404);
for (const route of ["/wp/", "/.env", "/rss", "/blog/prairie-dev-con-2026-the-future-is-agentic/bc", "//www.youtube.com/embed/M5OQchl9bQA", "/talks/no-such-talk/", "/tags/no-such-topic/", "/assets/no-such-image.png"]) {
  assert.equal((await request(route)).status, 404, `${route} must remain missing`);
}
const home = await (await request("/")).text();
assert.doesNotMatch(home, /static\.cloudflareinsights\.com|sentry/i);
if (telemetryExpected) {
  assert.match(home, /\/assets\/telemetry\/application-insights\.js/);
  assert.equal((await request("/assets/telemetry/application-insights.js")).status, 200);
} else {
  assert.doesNotMatch(home, /\/assets\/telemetry\/application-insights\.js/);
}
console.log(`Hosting checks passed: ${origin}; ${redirectsToCheck.length} permanent redirects retain queries and reach published targets.`);
