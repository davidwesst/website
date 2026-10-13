import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RESERVED_BLOG_SLUGS } from "../lib/content-routing.js";

const POST_DIRECTORIES = ["articles", "gamelogs", "dungeonlogs"];
const CONTENT_TYPES = {
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
  const date = options.date ?? new Date();
  const normalizedName = String(name ?? "").trim();
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
  const content = source
    .replaceAll("{{ title }}", yamlString(titleFromName(normalizedName)))
    .replaceAll("{{ date }}", formatDate(date))
    .replaceAll("{{ slug }}", slug);

  await mkdir(destinationDirectory);
  await writeFile(destination, content, { encoding: "utf8", flag: "wx" });

  return { destination, slug };
}

export async function createGamelog(name, options = {}) {
  return createPost("gamelog", name, options);
}

export async function createArticle(name, options = {}) {
  return createPost("article", name, options);
}

async function main() {
  const [type, ...nameParts] = process.argv.slice(2);
  if (!Object.hasOwn(CONTENT_TYPES, type) || nameParts.length === 0) {
    throw new Error("Usage: pnpm run new <article|gamelog> <name>");
  }

  const result = await createPost(type, nameParts.join(" "));
  console.log(`Created ${path.relative(process.cwd(), result.destination)}`);
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedFile === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
