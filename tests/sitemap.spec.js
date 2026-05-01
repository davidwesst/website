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
