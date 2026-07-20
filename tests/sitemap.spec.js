import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { getDocuments, getEvents } from "../src/_lib/content/index.js";

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function getSitemapPaths(request) {
  const sitemapResponse = await request.get("/sitemap.xml");
  await expect(sitemapResponse).toBeOK();

  const sitemapXml = await sitemapResponse.text();

  return extractLocs(sitemapXml).map((location) => new URL(location).pathname);
}

test("all generated sitemap paths respond successfully", async ({ request, baseURL }) => {
  const sitemapPaths = await getSitemapPaths(request);

  expect(sitemapPaths.length).toBeGreaterThan(0);

  for (const path of sitemapPaths) {
    const response = await request.get(`${baseURL}${path}`);

    expect(response.ok(), `${path} should return a success response`).toBeTruthy();
  }
});

test("sitemap includes every canonical content page", async ({ request }) => {
  const sitemapPaths = await getSitemapPaths(request);
  const expectedPaths = [
    ...getDocuments().map((document) => document.canonicalUrl),
    ...getEvents().map((event) => event.canonicalUrl),
  ].sort();

  expect(sitemapPaths).toEqual(expect.arrayContaining(expectedPaths));
  expect(sitemapPaths.filter((path) => path.startsWith("/talks/") && path !== "/talks/").sort()).toEqual(
    getDocuments()
      .filter((document) => document.docType === "talk")
      .map((document) => document.canonicalUrl)
      .sort(),
  );
  expect(sitemapPaths.filter((path) => path.startsWith("/events/") && path !== "/events/").sort()).toEqual(
    getEvents()
      .map((event) => event.canonicalUrl)
      .sort(),
  );
});

test("about page is generated from canonical data", async ({ request }) => {
  const response = await request.get("/about/");
  await expect(response).toBeOK();

  const html = await response.text();

  expect(html).toContain("<h1>About</h1>");
  expect(html).toContain("Hullo. My name is David Wesst");
});

test("projects page is generated from canonical data", async ({ request }) => {
  const response = await request.get("/projects/");
  await expect(response).toBeOK();

  const html = await response.text();

  expect(html).toContain("<h1>Projects</h1>");
  expect(html).toContain("<section>");
  expect(html).toContain("<h2>Cocoboko Studios</h2>");
  expect(html).toContain("Status: Active");
  expect(html).toContain("<h2>Remember the Human</h2>");
  expect(html).toContain("Status: Archived");
});

test("site navigation is placed correctly on home and content pages", async ({ request }) => {
  const homeResponse = await request.get("/");
  await expect(homeResponse).toBeOK();
  const homeHtml = await homeResponse.text();

  expect(homeHtml.indexOf("<h1><a href=\"/\">david.wes.st</a></h1>")).toBeGreaterThan(-1);
  expect(homeHtml.indexOf("<nav aria-label=\"Site\"")).toBeGreaterThan(-1);
  expect(homeHtml.indexOf("<h1><a href=\"/\">david.wes.st</a></h1>")).toBeLessThan(
    homeHtml.indexOf("<nav aria-label=\"Site\""),
  );
  expect(homeHtml).toContain("<a href=\"/about/\">About</a>");
  expect(homeHtml).toContain("<a href=\"/projects/\">Projects</a>");
  expect(homeHtml.indexOf("<a href=\"/events/\">Events</a>")).toBeLessThan(
    homeHtml.indexOf("<a href=\"/projects/\">Projects</a>"),
  );
  expect(homeHtml).not.toContain("<a href=\"/site-index/\">Site Index</a>");
  expect(homeHtml).toContain("<a href=\"/about/\">About</a>");
  expect(homeHtml).toContain("<a href=\"/projects/\">Projects</a>");
  expect(homeHtml).toContain("<a href=\"/blog/?series=gamelog\">Gamelog</a>");
  expect(homeHtml).toContain("<a href=\"/blog/?series=dungeonlog\">Dungeonlog</a>");
  expect(homeHtml).not.toContain("<a href=\"/site-index/\">site-index/</a>");

  const talksResponse = await request.get("/talks/");
  await expect(talksResponse).toBeOK();
  const talksHtml = await talksResponse.text();

  expect(talksHtml.indexOf("<nav aria-label=\"Site\"")).toBeGreaterThan(-1);
  expect(talksHtml.indexOf("<h1>Talks</h1>")).toBeGreaterThan(-1);
  expect(talksHtml.indexOf("<nav aria-label=\"Site\"")).toBeLessThan(talksHtml.indexOf("<h1>Talks</h1>"));
});

test("home page renders social links from site data", async ({ request }) => {
  const response = await request.get("/");
  await expect(response).toBeOK();
  const html = await response.text();

  expect(html).toContain('<link rel="stylesheet" href="/assets/main.css">');
  expect(html).not.toContain("font-awesome");
  expect(html).toContain('<a href="https://github.com/davidwesst" target="_blank" rel="noopener noreferrer">');
  expect(html).toContain("GitHub");
  expect(html).toContain('<a href="https://ca.linkedin.com/in/davidwesst" target="_blank" rel="noopener noreferrer">');
  expect(html).toContain("LinkedIn");
  expect(html).toContain('<a href="https://youtube.com/davidwesst" target="_blank" rel="noopener noreferrer">');
  expect(html).toContain("YouTube");
});

test("site index excludes data-generated detail pages", async ({ request }) => {
  const response = await request.get("/site-index/");
  await expect(response).toBeOK();
  const html = await response.text();

  expect(html).toContain("<a href=\"/talks/\">Talks</a>");
  expect(html).toContain("<a href=\"/events/\">Events</a>");
  expect(html).not.toContain("/talks/consensus-in-the-chaos/");
  expect(html).not.toContain("/events/ceug-2025/");
});

test("legacy typoed talk URL redirects directly to canonical talk URL", async ({ request }) => {
  const response = await request.get("/talks/concensus-in-the-chaos/", {
    maxRedirects: 0,
  });

  expect(response.status()).toBe(301);
  expect(response.headers().location).toBe("/talks/consensus-in-the-chaos/");
});

test("legacy about URL redirects directly to canonical about URL", async ({ request }) => {
  const response = await request.get("/about.html", {
    maxRedirects: 0,
  });

  expect(response.status()).toBe(301);
  expect(response.headers().location).toBe("/about/");
});

test("legacy project URLs redirect directly to canonical projects URL", async ({ request }) => {
  const cocobokoResponse = await request.get("/cocoboko-studios.html", {
    maxRedirects: 0,
  });
  const rememberResponse = await request.get("/remember-the-human.html", {
    maxRedirects: 0,
  });

  expect(cocobokoResponse.status()).toBe(301);
  expect(cocobokoResponse.headers().location).toBe("/projects/");
  expect(rememberResponse.status()).toBe(301);
  expect(rememberResponse.headers().location).toBe("/projects/");
});

test("blog page emits filters, feed links, and client-side filtering script", async ({ request }) => {
  const response = await request.get("/blog/");
  await expect(response).toBeOK();

  const html = await response.text();

  expect(html).toContain('<input type="checkbox" name="series" value="blog"');
  expect(html).toContain('<input type="checkbox" name="series" value="gamelog"');
  expect(html).toContain('<input type="checkbox" name="series" value="dungeonlog"');
  expect(html).toContain('<a href="/blog/feed.xml"');
  expect(html).toContain('<a href="/blog/gamelog/feed.xml"');
  expect(html).toContain('<a href="/blog/dungeonlog/feed.xml"');
  expect(html).toContain("<script");
  expect(html).toContain("window.history.replaceState");
  expect(html).toContain("item.hidden = !isVisible");
  expect(html).toContain('params.set("series", selected.join(","))');
  expect(html).not.toContain("classList");
});

test("representative pages contain no presentation attributes", async ({ page }) => {
  const paths = [
    "/",
    "/about/",
    "/projects/",
    "/blog/",
    "/blog/windows-not-required-video/",
    "/blog/gamelog/blue-prince/",
    "/talks/",
    "/talks/consensus-in-the-chaos/",
    "/events/",
    "/events/ceug-2025/",
    "/site-index/",
  ];

  for (const path of paths) {
    await page.goto(path);

    await expect(page.locator("[class], [style], [width], [height], [align], [bgcolor], [border], [cellpadding], [cellspacing]"), `${path} should not contain presentation attributes`).toHaveCount(0);
    await expect(page.locator("body"), `${path} should not contain terminal decorations`).not.toContainText("~/davidwesst");
  }
});

test("the page head references only the compiled Tailwind stylesheet", async ({ page }) => {
  await page.goto("/");

  const stylesheets = page.locator('link[rel="stylesheet"]');
  await expect(stylesheets).toHaveCount(1);
  await expect(stylesheets).toHaveAttribute("href", "/assets/main.css");
});

test("the CSS source wires Tailwind without Preflight or custom rules", async ({ request }) => {
  const cssSource = readFileSync(new URL("../src/styles/main.css", import.meta.url), "utf8");

  expect(cssSource).toContain('@import "tailwindcss/theme.css" layer(theme);');
  expect(cssSource).toContain('@import "tailwindcss/utilities.css" layer(utilities) source(none);');
  expect(cssSource).not.toContain("preflight");
  expect(cssSource).not.toContain("{");

  const response = await request.get("/assets/main.css");
  await expect(response).toBeOK();
  expect(await response.text()).not.toContain(".site-header");
});

test("blog filtering uses data hooks and native hidden state", async ({ page }) => {
  await page.goto("/blog/");

  const items = page.locator("[data-post-item]");
  const visibleItems = page.locator("[data-post-item]:visible");

  expect(await items.count()).toBeGreaterThan(await visibleItems.count());
  await expect(visibleItems.first()).toHaveAttribute("data-series", "blog");

  await page.goto("/blog/?series=gamelog");
  const filteredItems = page.locator("[data-post-item]:visible");
  expect(await filteredItems.count()).toBeGreaterThan(0);
  expect(await filteredItems.evaluateAll((entries) => entries.every((entry) => entry.dataset.series === "gamelog"))).toBe(true);
  await expect(page.locator("[data-post-count]")).toContainText("posts");
});

test("talk sorting uses data hooks and updates pressed state", async ({ page }) => {
  await page.goto("/talks/");

  const cards = page.locator("[data-talk-card]");
  const titleButton = page.locator('button[data-sort="title"]');
  await titleButton.click();

  const titles = await cards.evaluateAll((entries) => entries.map((entry) => entry.dataset.title));
  expect(titles).toEqual([...titles].sort((first, second) => first.localeCompare(second)));
  await expect(titleButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('button[data-sort="last-presented"]')).toHaveAttribute("aria-pressed", "false");
});
