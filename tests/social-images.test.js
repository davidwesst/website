import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { load } from "cheerio";
import { prepareSocialImages } from "../lib/social-images.js";

test("social images preserve sources, fit portrait content, and change URLs when source changes", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "social-images-"));
  try {
    const assets = path.join(root, "src/assets/images");
    const document = path.join(root, "src/content/posts/articles/example");
    await mkdir(assets, { recursive: true });
    await mkdir(document, { recursive: true });
    const image = await sharp({ create: { width: 100, height: 200, channels: 3, background: "red" } }).png().toBuffer();
    await writeFile(path.join(assets, "default-social.png"), image);
    await writeFile(path.join(document, "cover.png"), image);
    await writeFile(path.join(document, "index.md"), "---\ntitle: Example\nbanner:\n  src: ./cover.png\n  alt: Portrait\n---\nBody");
    const images = await prepareSocialImages(root, {});
    const preview = images["/blog/example/cover.png"];
    const bytes = await readFile(path.join(root, ".cache/social-images/images", path.basename(preview.src)));
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 630);
    const { data } = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
    // Contain leaves a dark border and keeps the red portrait centered.
    assert.ok(data[0] < 30);
    assert.ok(data[(315 * 1200 + 600) * 3] > 200);
    assert.deepEqual(await readFile(path.join(document, "cover.png")), image);
    assert.deepEqual(await prepareSocialImages(root, {}), images);
    await writeFile(path.join(document, "cover.png"), await sharp(image).negate().png().toBuffer());
    assert.notEqual((await prepareSocialImages(root, {}))["/blog/example/cover.png"].src, preview.src);
    await rm(path.join(document, "cover.png"));
    await assert.rejects(prepareSocialImages(root, {}), /ENOENT/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("every shareable built page has complete Open Graph metadata and a real JPEG preview", async () => {
  const root = path.resolve("_site");
  for (const entry of await readdir(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || entry.name !== "index.html") continue;
    const $ = load(await readFile(path.join(entry.parentPath, entry.name), "utf8"));
    if ($('meta[name="robots"]').attr("content")?.includes("noindex")) continue;
    for (const field of ["title", "description", "url", "type", "site_name", "image", "image:alt", "image:width", "image:height", "image:type"]) {
      assert.ok($(`meta[property="og:${field}"]`).attr("content"), `${entry.parentPath}: ${field}`);
    }
    assert.equal($('meta[property="og:url"]').attr("content"), $('link[rel="canonical"]').attr("href"));
    const url = new URL($('meta[property="og:image"]').attr("content"));
    assert.equal(url.protocol, "https:");
    const image = await sharp(await readFile(path.join(root, url.pathname))).metadata();
    assert.equal(image.width, 1200);
    assert.equal(image.height, 630);
    assert.equal(image.format, "jpeg");
    if ($('meta[property="og:type"]').attr("content") !== "article") assert.equal($('meta[property="article:published_time"]').length, 0);
  }
});
