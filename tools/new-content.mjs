import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RESERVED_BLOG_SLUGS } from "../lib/content-routing.js";

const POST_DIRECTORIES = ["articles", "gamelogs", "dungeonlogs"];

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

export async function createGamelog(name, options = {}) {
  const root = path.resolve(options.root ?? process.cwd());
  const template = path.resolve(options.template ?? path.join(root, "templates", "gamelog", "index.md"));
  const date = options.date ?? new Date();
  const normalizedName = String(name ?? "").trim();
  const slug = slugify(normalizedName);

  if (!normalizedName) throw new Error("A gamelog name is required.");
  if (!slug) throw new Error(`The gamelog name ${yamlString(normalizedName)} does not produce a valid URL slug.`);
  if (RESERVED_BLOG_SLUGS.has(slug)) throw new Error(`The slug ${yamlString(slug)} is reserved for a blog index.`);
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) throw new Error("The gamelog date is invalid.");
  if (!existsSync(template)) throw new Error(`Gamelog template not found: ${template}`);

  for (const postType of POST_DIRECTORIES) {
    const existing = path.join(root, "src", "content", "posts", postType, slug);
    if (existsSync(existing)) throw new Error(`The post slug ${yamlString(slug)} already exists in ${postType}.`);
  }

  const destinationDirectory = path.join(root, "src", "content", "posts", "gamelogs", slug);
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

async function main() {
  const [type, ...nameParts] = process.argv.slice(2);
  if (type !== "gamelog" || nameParts.length === 0) {
    throw new Error("Usage: pnpm run new gamelog <name-of-the-gamelog>");
  }

  const result = await createGamelog(nameParts.join(" "));
  console.log(`Created ${path.relative(process.cwd(), result.destination)}`);
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedFile === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
