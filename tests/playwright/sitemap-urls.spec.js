import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { XMLParser } from 'fast-xml-parser';

const repoRoot = process.cwd();
const sitemapPath = path.join(repoRoot, '_site', 'sitemap.xml');
const legacyContractPath = path.join(repoRoot, 'tests', 'url_contracts', 'talks_url_contract.json');

function readSitemapUrls() {
  if (!fs.existsSync(sitemapPath)) {
    throw new Error('Missing _site/sitemap.xml. Build the 11ty site with sitemap generation before running this test.');
  }

  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);

  const urlNodes = parsed?.urlset?.url ?? [];
  const urls = Array.isArray(urlNodes) ? urlNodes : [urlNodes];

  return urls.map((entry) => {
    const loc = entry?.loc;
    if (!loc) throw new Error('Sitemap contains an entry with no <loc>.');
    return new URL(loc).pathname;
  });
}

function readLegacyRedirects() {
  const raw = fs.readFileSync(legacyContractPath, 'utf8');
  const data = JSON.parse(raw);
  return data.redirects ?? [];
}

test('sitemap exists and has canonical talk/event URLs', async ({ request }) => {
  const paths = readSitemapUrls();

  expect(paths.length).toBeGreaterThan(0);
  expect(new Set(paths).size).toBe(paths.length);
  expect(paths).toContain('/talks/');
  expect(paths).toContain('/events/');

  for (const pathname of paths) {
    const response = await request.get(pathname, { maxRedirects: 0 });
    expect(response.status(), `Expected canonical URL to resolve: ${pathname}`).toBe(200);
  }
});

test('legacy talk/event links redirect to canonical sitemap URLs', async ({ request }) => {
  const canonicalPaths = new Set(readSitemapUrls());
  const redirects = readLegacyRedirects();

  for (const redirect of redirects) {
    const response = await request.get(redirect.from, { maxRedirects: 0 });
    expect(response.status(), `Expected redirect status for ${redirect.from}`).toBe(redirect.status);

    const location = response.headers()['location'];
    expect(location, `Expected Location header for ${redirect.from}`).toBeTruthy();

    const redirectedPath = new URL(location, 'http://127.0.0.1:8080').pathname;
    expect(redirectedPath).toBe(redirect.to);
    expect(canonicalPaths.has(redirectedPath), `Redirect target must be in sitemap: ${redirectedPath}`).toBeTruthy();
  }
});
