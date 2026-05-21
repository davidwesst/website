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
  expect(html).toContain('<section class="project-entry project-entry--active">');
  expect(html).toContain("<h2>Cocoboko Studios</h2>");
  expect(html).toContain('Status: <span>Active</span>');
  expect(html).toContain('<section class="project-entry project-entry--archived">');
  expect(html).toContain("<h2>Remember the Human</h2>");
  expect(html).toContain('Status: <span>Archived</span>');
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
  expect(homeHtml).toContain("<a href=\"/about/\">about/</a>");
  expect(homeHtml).toContain("<a href=\"/projects/\">projects/</a>");
  expect(homeHtml).toContain("<a href=\"/blog/?series=gamelog\">gamelog/</a>");
  expect(homeHtml).toContain("<a href=\"/blog/?series=dungeonlog\">dungeonlog/</a>");
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

  expect(html).toContain("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css");
  expect(html).toContain('<a href="https://github.com/davidwesst" target="_blank" rel="noopener noreferrer">');
  expect(html).toContain('class="fa-brands fa-github"');
  expect(html).toContain('<a href="https://ca.linkedin.com/in/davidwesst" target="_blank" rel="noopener noreferrer">');
  expect(html).toContain('class="fa-brands fa-linkedin"');
  expect(html).toContain('<a href="https://youtube.com/davidwesst" target="_blank" rel="noopener noreferrer">');
  expect(html).toContain('class="fa-brands fa-youtube"');
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
});
