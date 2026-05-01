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
