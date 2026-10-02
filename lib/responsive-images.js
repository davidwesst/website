import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { canonicalAssetDirectory } from "./content-routing.js";

const EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const SETTINGS = { minimumBytes: 1_000_000, widths: [384, 768, 1024, 1536, 2048], quality: 90, sharp: sharp.versions.sharp, vips: sharp.versions.vips };
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function readResponsiveManifest(root = process.cwd()) {
  try {
    return JSON.parse(await readFile(path.join(root, ".cache/responsive-images/manifest.json"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { images: {} };
    throw error;
  }
}

export async function prepareResponsiveImages(root = process.cwd()) {
  const contentRoot = path.join(root, "src/content");
  const cacheRoot = path.join(root, ".cache/responsive-images");
  const previous = await readResponsiveManifest(root);
  const manifest = { version: 1, settings: SETTINGS, images: {} };
  const files = (await readdir(contentRoot, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile() && EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(entry.parentPath, entry.name)).sort();

  for (const file of files) {
    const original = await readFile(file);
    if (original.length < SETTINGS.minimumBytes) continue;
    const metadata = await sharp(original).metadata();
    // Animated images retain their existing rendering and original asset.
    if (metadata.pages > 1) continue;
    const { width, height } = metadata.autoOrient || metadata;
    const route = `/${canonicalAssetDirectory(path.relative(contentRoot, file))}/${path.basename(file)}`;
    const sha256 = digest(original);
    const key = digest(`${sha256}:${JSON.stringify(SETTINGS)}`).slice(0, 24);
    const widths = [...new Set([...SETTINGS.widths.filter((size) => size < width), Math.min(width, SETTINGS.widths.at(-1))])];
    const variants = [];
    await mkdir(path.join(cacheRoot, "images", key), { recursive: true });

    for (const size of widths) {
      const src = `/assets/responsive/${key}/${size}.webp`;
      const destination = path.join(cacheRoot, "images", key, `${size}.webp`);
      const cached = previous.images[route]?.sha256 === sha256 && previous.images[route]?.variants.find((variant) => variant.src === src);
      if (cached) {
        const bytes = await readFile(destination).catch((error) => { if (error.code !== "ENOENT") throw error; });
        if (bytes && digest(bytes) === cached.sha256) { variants.push(cached); continue; }
      }
      const { data, info } = await sharp(original).rotate().resize({ width: size, withoutEnlargement: true })
        .webp({ quality: SETTINGS.quality, effort: 5 }).toBuffer({ resolveWithObject: true });
      // Only advertise derivatives that improve on the original transfer.
      if (data.length >= original.length) continue;
      await writeFile(destination, data);
      variants.push({ src, width: info.width, height: info.height, bytes: data.length, sha256: digest(data) });
    }
    if (variants.length) manifest.images[route] = { width, height, bytes: original.length, sha256, variants };
  }
  await mkdir(cacheRoot, { recursive: true });
  await writeFile(path.join(cacheRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}
