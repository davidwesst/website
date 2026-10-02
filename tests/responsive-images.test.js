import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { load } from "cheerio";
import sharp from "sharp";
import { prepareResponsiveImages, readResponsiveManifest } from "../lib/responsive-images.js";
import { enhanceBodyImages, prepareDisplayBanner, responsiveImage } from "../src/_lib/responsive-images.js";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const images = {
  "/blog/example/banner.png": { width: 1024, height: 512, variants: [{ src: "/assets/responsive/test/384.webp", width: 384 }, { src: "/assets/responsive/test/1024.webp", width: 1024 }] },
};

test("preparation preserves originals, bounds widths, reuses verified cache, and repairs corrupt derivatives", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "responsive-images-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const directory = path.join(root, "src/content/posts/articles/example");
  await mkdir(directory, { recursive: true });
  const pixels = Buffer.alloc(1024 * 512 * 3);
  let seed = 1;
  for (let i = 0; i < pixels.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; pixels[i] = seed >>> 24; }
  const original = await sharp(pixels, { raw: { width: 1024, height: 512, channels: 3 } }).png().toBuffer();
  const file = path.join(directory, "banner.png");
  await writeFile(file, original);
  await writeFile(path.join(directory, "small.png"), await sharp({ create: { width: 10, height: 10, channels: 3, background: "red" } }).png().toBuffer());
  const first = await prepareResponsiveImages(root);
  assert.deepEqual(Object.keys(first.images), ["/blog/example/banner.png"]);
  assert.deepEqual(await readFile(file), original);
  const image = first.images["/blog/example/banner.png"];
  assert.deepEqual(image.variants.map((variant) => variant.width), [384, 768, 1024]);
  assert.equal(image.sha256, digest(original));
  for (const variant of image.variants) {
    assert.ok(variant.bytes < original.length);
    // Buffer input releases the file before the corruption test on Windows.
    const metadata = await sharp(await readFile(path.join(root, ".cache/responsive-images/images", variant.src.slice("/assets/responsive/".length)))).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, variant.width);
    assert.equal(metadata.height, variant.height);
  }
  assert.deepEqual(await prepareResponsiveImages(root), first);
  const derivative = path.join(root, ".cache/responsive-images/images", image.variants[0].src.slice("/assets/responsive/".length));
  await writeFile(derivative, "corrupt cache");
  assert.deepEqual(await prepareResponsiveImages(root), first);
  assert.equal(digest(await readFile(derivative)), image.variants[0].sha256);
  await writeFile(file, await sharp(original).flop().png().toBuffer());
  const changed = await prepareResponsiveImages(root);
  assert.notEqual(changed.images["/blog/example/banner.png"].variants[0].src, image.variants[0].src);
});

test("normalized banners keep the original source, alt text, credit, and IGDB fallback", () => {
  const banner = { src: "./banner.png", alt: "Meaningful artwork", credit: "Creator" };
  const data = { banner, page: { url: "/blog/example/" }, responsiveImages: images };
  const display = prepareDisplayBanner(data);
  assert.equal(display.src, banner.src);
  assert.equal(display.alt, banner.alt);
  assert.equal(display.credit, banner.credit);
  assert.equal(display.responsive.width, 1024);
  assert.deepEqual(data.banner, banner);
  assert.equal(responsiveImage("https://external.example/banner.png", data.page.url, images), null);
  assert.equal(responsiveImage("./small.png", data.page.url, images), null);
  assert.equal(prepareDisplayBanner({ ...data, banner: null, resolvedBanner: { src: "/assets/igdb/game.jpg", alt: "Game" } }).src, "/assets/igdb/game.jpg");
});

test("inline pictures preserve linked original assets and alt text, reserve space, and skip unrelated images", () => {
  const html = '<html><body><section class="prose-content"><p><a href="./banner.png"><img src="./banner.png" alt="Artwork &amp; text" title="Caption"></a><img src="https://external.example/pic.png" alt="Remote"></p></section></body></html>';
  const result = enhanceBodyImages(html, "/blog/example/", images);
  const $ = load(result);
  assert.equal($("picture").length, 1);
  assert.equal($("picture img").attr("src"), "./banner.png");
  assert.equal($("picture img").attr("alt"), "Artwork & text");
  assert.equal($("picture img").attr("title"), "Caption");
  assert.equal($("picture img").attr("width"), "1024");
  assert.equal($("picture img").attr("height"), "512");
  assert.equal($("picture").parent().attr("href"), "./banner.png");
  assert.equal($("source").attr("type"), "image/webp");
  assert.match($("source").attr("srcset"), /384w, .*1024w/);
  assert.equal(enhanceBodyImages(result, "/blog/example/", images), result);
  assert.equal(enhanceBodyImages(html, "/blog/other/", images), html);
});

test("built derivatives are valid smaller images and original asset URLs remain byte-for-byte intact", async () => {
  const manifest = await readResponsiveManifest();
  assert.ok(Object.keys(manifest.images).length > 0);
  for (const [route, image] of Object.entries(manifest.images)) {
    assert.equal(digest(await readFile(path.join("_site", route))), image.sha256, route);
    for (const variant of image.variants) {
      const file = path.join("_site", variant.src);
      const bytes = await readFile(file);
      const metadata = await sharp(file).metadata();
      assert.equal(digest(bytes), variant.sha256, variant.src);
      assert.equal(metadata.format, "webp");
      assert.equal(metadata.width, variant.width);
      assert.equal(metadata.height, variant.height);
      assert.ok(variant.width <= image.width);
      assert.ok(bytes.length < image.bytes);
    }
  }
});

test("detail, card, and inline output advertises working responsive sources without changing preview images", async () => {
  const manifest = await readResponsiveManifest();
  const files = (await readdir("_site", { recursive: true })).filter((file) => file.endsWith(".html"));
  const rendered = new Set();
  for (const file of files) {
    const $ = load(await readFile(path.join("_site", file), "utf8"));
    const pageUrl = `/${file.replace(/index\.html$/, "")}`;
    for (const element of $("img").toArray()) {
      const img = $(element);
      const normalized = responsiveImage(img.attr("src"), pageUrl, manifest.images);
      if (!normalized) continue;
      const route = new URL(img.attr("src"), `https://example.test${pageUrl}`).pathname;
      rendered.add(route);
      const source = img.parent("picture").find("source[type='image/webp']");
      assert.equal(source.attr("srcset"), normalized.srcset, `${file}: ${route}`);
      assert.ok(source.attr("sizes"));
      assert.equal(img.attr("width"), String(normalized.width));
      assert.equal(img.attr("height"), String(normalized.height));
      assert.ok(img.attr("alt")?.trim());
    }
    const preview = $("meta[property='og:image']").attr("content");
    if (preview) assert.ok(!preview.includes("/assets/responsive/"));
  }
  assert.ok(rendered.has("/blog/2026-02-08/2026-02-08_Poster.png"));
  assert.ok(rendered.has("/talks/three-perspectives-on-ai/three-perspectives-on-ai_banner.png"));
  assert.ok(rendered.has("/blog/remote-ie-no-more-testing-excuses/wp_20141103_002-1-.jpg"));
});
