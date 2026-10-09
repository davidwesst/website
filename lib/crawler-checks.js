import assert from "node:assert/strict";
import { load } from "cheerio";
import { CRAWLER_POLICY, renderRobots, robotsAllows } from "./crawler-policy.js";
import site from "../src/_data/site.js";

export const REPRESENTATIVE_ROUTES = ["/", "/about/", "/blog/jan-2020-devlog/", "/blog/paranormasight-the-mermaids-curse/"];
export async function checkCrawlerAccess(origin, { verifyPolicy = false, fetchFn = fetch } = {}) {
  const get = async (route, agent = "CrawlerCompatibilityCheck") => {
    const response = await fetchFn(`${origin}${route}`, { headers: { "User-Agent": `${agent}/1.0` }, redirect: "manual", signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, `${agent}: ${route} must return 200, not a challenge or redirect`);
    return response;
  };
  const robots = await (await get("/robots.txt")).text();
  assert.ok(robots.includes(`Sitemap: ${site.url}/sitemap.xml`));
  if (verifyPolicy) assert.equal(robots.replaceAll("\r\n", "\n").trim(), renderRobots(site.url).trim(), "Effective robots file differs from the repository policy (check CDN-managed directives)");
  if (verifyPolicy) for (const crawler of CRAWLER_POLICY) assert.equal(robotsAllows(robots, crawler.agent), crawler.allow, `${crawler.agent}: effective policy differs from registry`);
  // UA probes detect access regressions; they do not authenticate as the real crawler.
  const agents = [...CRAWLER_POLICY.filter((crawler) => crawler.allow).map((crawler) => crawler.agent), "Discordbot", "LinkedInBot", "redditbot"];
  for (const agent of agents) {
    for (const route of REPRESENTATIVE_ROUTES) {
      assert.ok(robotsAllows(robots, agent, route), `${agent}: ${route} blocked by robots`);
      const response = await get(route, agent);
      const $ = load(await response.text());
      assert.equal($("main").length, 1);
      assert.equal($("h1").length, 1);
      assert.equal($('link[rel="canonical"]').attr("href"), new URL(route, site.url).href);
      assert.ok(!$('meta[name="robots"]').attr("content")?.includes("noindex"));
      const jsonLd = $('script[type="application/ld+json"]').text();
      assert.ok(jsonLd, `${agent}: ${route} must expose JSON-LD in initial HTML`);
      const graph = JSON.parse(jsonLd)["@graph"];
      assert.equal(graph[0].author["@id"], `${site.url}/#person`);
      if (route.startsWith("/blog/")) {
        assert.ok($("main > article .prose-content").text().trim());
        assert.equal($('a[rel="author"]').text(), site.title);
        assert.ok($("main > article time[datetime]").length);
      }
      await (await get(new URL($('meta[property="og:image"]').attr("content")).pathname, agent)).arrayBuffer();
    }
  }
  for (const route of ["/sitemap.xml", "/feed.xml", "/favicon.ico", "/assets/main.css"]) await get(route);
  return { agents: agents.length, pages: REPRESENTATIVE_ROUTES.length, policyChecked: verifyPolicy };
}
