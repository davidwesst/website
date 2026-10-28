import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RESERVED_BLOG_SLUGS } from "../lib/content-routing.js";

import { normalizeYoutube } from "../lib/video.js";
import { fetchYoutubeMetadata, fetchYoutubeThumbnail } from "../lib/youtube-metadata.js";

const POST_DIRECTORIES = ["articles", "gamelogs", "dungeonlogs", "videos"];
const CONTENT_TYPES = {
  video: { directory: "videos", template: "video" },
  article: { directory: "articles", template: "article" },
  gamelog: { directory: "gamelogs", template: "gamelog" },
};

function slugify(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromName(value) {
  return value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function yamlString(value) {
  return JSON.stringify(value);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function createPost(type, name, options = {}) {
  const configuration = CONTENT_TYPES[type];
  const root = path.resolve(options.root ?? process.cwd());
  const template = path.resolve(options.template ?? path.join(root, "templates", configuration.template, "index.md"));
  const video = type === "video" ? normalizeYoutube(options.youtube) : null;
  if (options.date !== undefined && (!(options.date instanceof Date) || Number.isNaN(options.date.valueOf()))) throw new Error("The post date is invalid.");
  const metadata = video && options.fetchYoutube ? await fetchYoutubeMetadata(video.url, options) : null;
  const date = options.date ?? metadata?.date ?? new Date();
  const normalizedName = String(name || metadata?.title || "").trim();
  const slug = slugify(normalizedName);

  if (!normalizedName) throw new Error(`${type === "article" ? "An" : "A"} ${type} name is required.`);
  if (!slug) throw new Error(`The ${type} name ${yamlString(normalizedName)} does not produce a valid URL slug.`);
  if (RESERVED_BLOG_SLUGS.has(slug)) throw new Error(`The slug ${yamlString(slug)} is reserved for a blog index.`);
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) throw new Error(`The ${type} date is invalid.`);
  if (!existsSync(template)) throw new Error(`${titleFromName(type)} template not found: ${template}`);

  for (const postType of POST_DIRECTORIES) {
    const existing = path.join(root, "src", "content", "posts", postType, slug);
    if (existsSync(existing)) throw new Error(`The post slug ${yamlString(slug)} already exists in ${postType}.`);
  }

  const destinationDirectory = path.join(root, "src", "content", "posts", configuration.directory, slug);
  const destination = path.join(destinationDirectory, "index.md");
  const source = await readFile(template, "utf8");
  let thumbnail;
  const warnings = [];
  if (metadata) {
    try { thumbnail = await fetchYoutubeThumbnail(metadata.thumbnailUrl, options); }
    catch { warnings.push("Could not save the YouTube thumbnail; add a local banner image if desired."); }
  }
  const fields = {
    title: yamlString(video ? normalizedName : titleFromName(normalizedName)),
    date: formatDate(date),
    slug,
    youtube: yamlString(video?.url || ""),
    summary: yamlString(metadata?.summary || ""),
    banner: thumbnail
      ? `banner:
  src: ./${thumbnail.filename}
  alt: ${yamlString(`Thumbnail for “${normalizedName}”`)}`
      : `# banner:
#   src: ./thumbnail.jpg
#   alt: "Describe the thumbnail"`,
  };
  const content = source.replace(/{{ (title|date|slug|youtube|summary|banner) }}/g, (_, key) => fields[key]);

  await mkdir(path.dirname(destinationDirectory), { recursive: true });
  await mkdir(destinationDirectory);
  await writeFile(destination, content, { encoding: "utf8", flag: "wx" });

  if (thumbnail) await writeFile(path.join(destinationDirectory, thumbnail.filename), thumbnail.bytes, { flag: "wx" });
  return { destination, slug, warnings };
}

export async function createGamelog(name, options = {}) {
  return createPost("gamelog", name, options);
}

export async function createArticle(name, options = {}) {
  return createPost("article", name, options);
}

export async function createVideo(name, options = {}) {
  return createPost("video", name, options);
}

export function parseVideoArguments(args) {
  const names = [];
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--fetch-youtube") { options.fetchYoutube = true; continue; }
    if (["--youtube", "--date"].includes(arg)) {
      const value = args[++index];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}.`);
      if (arg === "--youtube") options.youtube = value;
      else {
        const date = new Date(value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) throw new Error("Use a valid --date YYYY-MM-DD.");
        options.date = date;
      }
    } else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else names.push(arg);
  }
  return { name: names.join(" "), options };
}

async function main() {
  const [type, ...nameParts] = process.argv.slice(2);
  if (!Object.hasOwn(CONTENT_TYPES, type) || nameParts.length === 0) {
    throw new Error("Usage: pnpm run new <article|gamelog> <name>; or pnpm new video [title] --youtube <url> [--date YYYY-MM-DD] [--fetch-youtube]");
  }

  const parsed = type === "video" ? parseVideoArguments(nameParts) : { name: nameParts.join(" "), options: {} };
  const result = await createPost(type, parsed.name, parsed.options);
  for (const warning of result.warnings) console.warn(warning);
  if (type === "video") console.log("Review the summary, publication date, and thumbnail alt text before publishing.");
  console.log(`Created ${path.relative(process.cwd(), result.destination)}`);
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedFile === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
