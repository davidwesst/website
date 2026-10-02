import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const [base = "http://localhost:8787", output = ".cache/image-audit/results.json"] = process.argv.slice(2);
const origin = new URL(base).origin;
const routes = JSON.parse(await readFile(new URL("../docs/image-audit-routes.json", import.meta.url), "utf8"));
const cases = [
  { name: "mobile", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  { name: "desktop", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
];
const pages = [...new Set(routes.map((route) => route.slice(0, route.lastIndexOf("/") + 1))), "/", "/blog/", "/talks/", "/blog/dungeonlogs/"];
const screenshots = new Set(["/", "/blog/", "/talks/", "/blog/2026-02-08/", "/talks/three-perspectives-on-ai/", "/blog/remote-ie-no-more-testing-excuses/"]);
const screenshotDirectory = output.replace(/\.json$/, "") + "-screenshots";
await mkdir(path.dirname(output), { recursive: true });
await mkdir(screenshotDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const result = { browser: browser.version(), origin, network: "local HTTP, no throttling, fresh browser context per page", cases, measurements: [] };
try {
  for (const { name, ...options } of cases) {
    for (const pageRoute of pages) {
      const context = await browser.newContext({ ...options, reducedMotion: "reduce" });
      try {
        const page = await context.newPage();
        const responses = new Map();
        const pending = [];
        page.on("response", (response) => {
          if (response.request().resourceType() !== "image") return;
          pending.push(response.body().then((bytes) => responses.set(response.url(), {
            bytes, status: response.status(), contentType: response.headers()["content-type"],
          })));
        });
        const navigation = await page.goto(origin + pageRoute, { waitUntil: "networkidle" });
        assert.equal(navigation.status(), 200, `${pageRoute}: page must be available for an audit`);
        // Include lazy cards below the fold without counting navigation as a timing benchmark.
        await page.evaluate(async () => {
          await document.fonts.ready;
          for (const img of document.querySelectorAll("img")) { img.scrollIntoView(); await img.decode().catch(() => {}); }
          window.scrollTo(0, 0);
        });
        const images = await page.evaluate((routes) => [...document.querySelectorAll("img")]
          .filter((img) => routes.includes(decodeURIComponent(new URL(img.getAttribute("src"), location.href).pathname)))
          .map((img) => ({
            originalRoute: decodeURIComponent(new URL(img.getAttribute("src"), location.href).pathname),
            source: new URL(img.currentSrc).pathname, alt: img.alt,
            width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height,
            widthAttribute: img.getAttribute("width"), heightAttribute: img.getAttribute("height"),
            sizes: img.closest("picture")?.querySelector("source")?.sizes,
            context: img.closest(".post-visual") ? "cropped" : img.closest(".prose-content") ? "body" : "banner",
            complete: img.complete && img.naturalWidth > 0,
          })), routes);
        await Promise.all(pending);
        for (const img of images) {
          assert.ok(img.complete, `${pageRoute}: image failed to decode`);
          const response = responses.get(origin + img.source);
          assert.ok(response, `${pageRoute}: missing browser image response for ${img.source}`);
          assert.equal(response.status, 200);
          const metadata = await sharp(response.bytes).metadata();
          result.measurements.push({ viewport: name, pageRoute, ...img, encodedWidth: metadata.width,
            encodedHeight: metadata.height, format: metadata.format, bytes: response.bytes.length,
            status: response.status, contentType: response.contentType });
        }
        if (screenshots.has(pageRoute)) {
          const filename = pageRoute === "/" ? "home" : pageRoute.replaceAll("/", "-").replace(/^-|-$/g, "");
          await page.screenshot({ path: path.join(screenshotDirectory, `${name}-${filename}.png`), fullPage: !["/blog/", "/talks/"].includes(pageRoute) });
        }
      } finally { await context.close(); }
    }
    console.log(`Captured ${name} image transfers and screenshots.`);
  }
  for (const route of routes) assert.ok(result.measurements.some((image) => image.originalRoute === route), `Audit route has no rendered image: ${route}`);
  await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Saved ${result.measurements.length} measurements to ${output}; bytes are response bodies, excluding headers.`);
} finally { await browser.close(); }
