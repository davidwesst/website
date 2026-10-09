import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";
import { canonicalContentUrl } from "./content-routing.js";
import { IGDB_CACHE_SCHEMA_VERSION, hasCachedImages, readIgdbManifest } from "./igdb.js";

export const DEFAULT_SOCIAL_IMAGE = "/assets/images/default-social.png";
const SETTINGS = { width: 1200, height: 630, quality: 90, background: "#0f172a", sharp: sharp.versions.sharp, vips: sharp.versions.vips };
const hash = (value) => createHash("sha256").update(value).digest("hex");

export async function prepareSocialImages(root = process.cwd(), games) {
  if (!games) {
    const cache = path.join(root, ".cache/igdb");
    const igdb = readIgdbManifest(cache);
    games = igdb?.schemaVersion === IGDB_CACHE_SCHEMA_VERSION && hasCachedImages(igdb, cache) ? igdb.games : {};
  }
  const sources = new Map([[DEFAULT_SOCIAL_IMAGE, path.join(root, "src/assets/images/default-social.png")]]);
  const contentRoot = path.join(root, "src/content");
  for (const entry of await readdir(contentRoot, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || entry.name !== "index.md") continue;
    const file = path.join(entry.parentPath, entry.name);
    const { data } = matter(await readFile(file, "utf8"));
    const segments = path.relative(contentRoot, file).split(path.sep);
    const type = segments[0] === "posts" ? segments[1] : segments[0];
    const route = canonicalContentUrl(type, path.basename(path.dirname(file)));
    const banner = data.banner || (type === "gamelogs" ? games?.[data.customData?.game?.ids?.igdb]?.banner : null);
    if (!banner?.src) continue;
    const url = new URL(banner.src, `https://images.invalid${route}`);
    if (url.origin !== "https://images.invalid") throw new Error(`Social images must be local build assets: ${file}`);
    const source = data.banner ? path.resolve(path.dirname(file), banner.src) : path.join(root, ".cache/igdb/images", path.basename(url.pathname));
    if (data.banner && !source.startsWith(`${contentRoot}${path.sep}`)) throw new Error(`Banner escapes active content: ${file}`);
    sources.set(url.pathname, source);
  }
  const destination = path.join(root, ".cache/social-images/images");
  await mkdir(destination, { recursive: true });
  const images = {};
  for (const [route, file] of [...sources].sort(([a], [b]) => a.localeCompare(b))) {
    const original = await readFile(file);
    const originalMetadata = await sharp(original).metadata();
    const dimensions = originalMetadata.autoOrient || originalMetadata;
    const key = hash(Buffer.concat([original, Buffer.from(JSON.stringify(SETTINGS))])).slice(0, 24);
    const filename = `${key}.jpg`;
    const bytes = await sharp(original).rotate().resize({ width: SETTINGS.width, height: SETTINGS.height, fit: "contain", background: SETTINGS.background }).flatten({ background: SETTINGS.background }).jpeg({ quality: SETTINGS.quality }).toBuffer();
    await writeFile(path.join(destination, filename), bytes);
    images[route] = { src: `/assets/social/${filename}`, width: SETTINGS.width, height: SETTINGS.height, sourceWidth: dimensions.width, sourceHeight: dimensions.height, type: "image/jpeg", sha256: hash(bytes) };
  }
  await writeFile(path.join(root, ".cache/social-images/manifest.json"), `${JSON.stringify({ images }, null, 2)}\n`);
  return images;
}
