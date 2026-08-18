import pluginWebc from "@11ty/eleventy-plugin-webc";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { canonicalAssetDirectory } from "./lib/content-routing.js";

const IMAGE_EXTENSIONS = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]);

function slash(value) {
  return value.replaceAll("\\", "/");
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

function topicSlug(value) {
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
  if (existsSync(path.resolve(".cache", "igdb", "images"))) {
    eleventyConfig.addPassthroughCopy({ ".cache/igdb/images": "assets/igdb" });
  }
  if (existsSync(path.resolve(".cache", "telemetry"))) {
    eleventyConfig.addPassthroughCopy({ ".cache/telemetry": "assets/telemetry" });
  }
  eleventyConfig.addPassthroughCopy({
    "node_modules/@fortawesome/fontawesome-free/css/all.min.css": "assets/fontawesome.css",
    "node_modules/@fortawesome/fontawesome-free/webfonts": "webfonts",
  });
  eleventyConfig.addPassthroughCopy(colocatedAssets());
  eleventyConfig.addFilter("topicSlug", topicSlug);
  eleventyConfig.addCollection("topicPages", (collectionApi) => {
    const topics = new Map();
    const items = collectionApi
      .getAll()
      .filter((item) => ["article", "gamelog", "dungeonlog", "talk"].includes(item.data.type));

    for (const item of items) {
      for (const topic of item.data.topics || []) {
        const slug = topicSlug(topic);
        if (!topics.has(slug)) topics.set(slug, { name: topic, slug, items: [] });
        topics.get(slug).items.push(item);
      }
    }

    return [...topics.values()]
      .map((topic) => ({
        ...topic,
        items: topic.items.sort((left, right) => right.date - left.date),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  });
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_includes/layouts");
  eleventyConfig.setOutputDirectory("_site");
}
