import pluginWebc from "@11ty/eleventy-plugin-webc";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const IMAGE_EXTENSIONS = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]);

function slash(value) {
  return value.replaceAll("\\", "/");
}

function canonicalAssetDirectory(relativeFile) {
  const segments = slash(relativeFile).split("/");
  if (segments[0] === "posts" && segments[1] === "articles") return `blog/${segments[2]}`;
  if (segments[0] === "posts" && segments[1] === "gamelogs") return `blog/gamelog/${segments[2]}`;
  if (segments[0] === "posts" && segments[1] === "dungeonlogs") return `blog/dungeonlog/${segments[2]}`;
  if (segments[0] === "talks") return `talks/${segments[1]}`;
  if (segments[0] === "pages") return segments[1];
  throw new Error(`Cannot determine output route for colocated asset: ${relativeFile}`);
}

function colocatedAssets() {
  const contentRoot = path.resolve("src/content");
  if (!existsSync(contentRoot)) return {};
  return Object.fromEntries(readdirSync(contentRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => {
      const source = entry.parentPath ? path.join(entry.parentPath, entry.name) : path.join(entry.path, entry.name);
      const relative = path.relative(contentRoot, source);
      return [slash(source), `${canonicalAssetDirectory(relative)}/${entry.name}`];
    }));
}

function categorySlug(value) {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginWebc, {
    components: "src/_includes/components/**/*.webc",
  });
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy(colocatedAssets());
  eleventyConfig.addFilter("categorySlug", categorySlug);
  eleventyConfig.addCollection("categoryPages", (collectionApi) => {
    const categories = new Map();
    const items = collectionApi
      .getAll()
      .filter((item) => ["article", "gamelog", "dungeonlog", "talk"].includes(item.data.type));

    for (const item of items) {
      for (const category of item.data.categories || []) {
        const slug = categorySlug(category);
        if (!categories.has(slug)) categories.set(slug, { name: category, slug, items: [] });
        categories.get(slug).items.push(item);
      }
    }

    return [...categories.values()]
      .map((category) => ({
        ...category,
        items: category.items.sort((left, right) => right.date - left.date),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  });
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_includes/layouts");
  eleventyConfig.setOutputDirectory("_site");
}
