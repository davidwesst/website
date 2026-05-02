import { test, expect } from "@playwright/test";

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

test("all generated sitemap paths respond successfully", async ({ request, baseURL }) => {
  const sitemapResponse = await request.get("/sitemap.xml");
  await expect(sitemapResponse).toBeOK();

  const sitemapXml = await sitemapResponse.text();
  const locations = extractLocs(sitemapXml);

  expect(locations.length).toBeGreaterThan(0);

  for (const location of locations) {
    const url = new URL(location);
    const response = await request.get(`${baseURL}${url.pathname}`);

    expect(response.ok(), `${url.pathname} should return a success response`).toBeTruthy();
  }
});

test("talk and event pages are generated from canonical data", async ({ request }) => {
  await expect(request.get("/talks/")).resolves.toBeOK();
  await expect(request.get("/talks/consensus-in-the-chaos/")).resolves.toBeOK();
  await expect(request.get("/events/")).resolves.toBeOK();
  await expect(request.get("/events/prairiedevcon-2022-regina/")).resolves.toBeOK();
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
