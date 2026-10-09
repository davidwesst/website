import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { CRAWLER_POLICY, renderRobots, robotsAllows } from "../lib/crawler-policy.js";
import { checkCrawlerAccess } from "../lib/crawler-checks.js";

test("effective robots allows discovery and assets while denying named training uses", async () => {
  const robots = await readFile("_site/robots.txt", "utf8");
  assert.equal(robots, renderRobots("https://david.wes.st"));
  for (const agent of ["Googlebot", "bingbot", "DuckDuckBot", "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Discordbot", "LinkedInBot", "redditbot", "OtherSearchBot"]) {
    for (const route of ["/", "/about/", "/blog/jan-2020-devlog/", "/assets/social/card.jpg", "/sitemap.xml", "/feed.xml"]) assert.ok(robotsAllows(robots, agent, route), `${agent}: ${route}`);
  }
  for (const agent of ["GPTBot", "ClaudeBot", "Google-Extended"]) assert.equal(robotsAllows(robots, agent), false);
  assert.ok(CRAWLER_POLICY.every((entry) => entry.reference.startsWith("https://")));
});
test("specific groups override the default and longest path wins with allow tie breaking", () => {
  const robots = "User-agent: *\nDisallow: /\nUser-agent: AllowedBot\nAllow: /\nDisallow: /private/\nAllow: /private/public/\n";
  assert.equal(robotsAllows(robots, "allowedbot", "/blog/"), true);
  assert.equal(robotsAllows(robots, "AllowedBot", "/private/file"), false);
  assert.equal(robotsAllows(robots, "AllowedBot", "/private/public/file"), true);
  assert.equal(robotsAllows(robots, "Unknown", "/"), false);
});
test("crawler probes reject challenges and redirects before claiming static content access", async () => {
  await assert.rejects(checkCrawlerAccess("https://david.wes.st", { fetchFn: async () => ({ status: 403 }) }), /challenge/);
  await assert.rejects(checkCrawlerAccess("https://david.wes.st", { fetchFn: async () => ({ status: 302 }) }), /redirect/);
  await assert.rejects(checkCrawlerAccess("https://david.wes.st", { verifyPolicy: true, fetchFn: async () => ({ status: 200, text: async () => "User-agent: *\nAllow: /\nSitemap: https://david.wes.st/sitemap.xml\n" }) }), /repository policy/);
});
