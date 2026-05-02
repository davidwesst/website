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

test("site navigation is placed correctly on home and content pages", async ({ request }) => {
  const homeResponse = await request.get("/");
  await expect(homeResponse).toBeOK();
  const homeHtml = await homeResponse.text();

  expect(homeHtml.indexOf("<h1><a href=\"/\">david.wes.st</a></h1>")).toBeGreaterThan(-1);
  expect(homeHtml.indexOf("<nav aria-label=\"Site\"")).toBeGreaterThan(-1);
  expect(homeHtml.indexOf("<h1><a href=\"/\">david.wes.st</a></h1>")).toBeLessThan(
    homeHtml.indexOf("<nav aria-label=\"Site\""),
  );

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
