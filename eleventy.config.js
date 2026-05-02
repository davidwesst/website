import pluginWebc from "@11ty/eleventy-plugin-webc";
import sitemapPlugin from "@quasibit/eleventy-plugin-sitemap";
import path from "node:path";
import site from "./src/_data/site.js";
import { getDocuments, getEvents, getPostDocuments } from "./src/_lib/content/index.js";

export default function(eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_includes/layouts");
  eleventyConfig.setOutputDirectory("_site");
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addPlugin(sitemapPlugin, {
    sitemap: {
      hostname: site.url,
    },
  });

  eleventyConfig.addPlugin(pluginWebc, {
    components: "src/_includes/components/**/*.webc",
  });

  for (const document of getDocuments()) {
    for (const asset of document.meta.assets) {
      eleventyConfig.addPassthroughCopy({
        [asset]: `${document.canonicalUrl.replace(/^\//, "")}${path.basename(asset)}`,
      });
    }
  }

  eleventyConfig.addCollection("sitePages", (collectionApi) => {
    return collectionApi
      .getAll()
      .filter((item) => item.url && item.outputPath && !item.data.eleventyExcludeFromCollections);
  });

  eleventyConfig.addCollection("siteIndexPages", (collectionApi) => {
    return collectionApi
      .getAll()
      .filter((item) => item.url && item.outputPath && !item.data.eleventyExcludeFromCollections)
      .filter((item) => !item.data.eleventyExcludeFromSiteIndex);
  });

  eleventyConfig.addCollection("documents", () => getDocuments());
  eleventyConfig.addCollection("posts", () => getPostDocuments());
  eleventyConfig.addCollection("reviews", () => getDocuments().filter((document) => document.docType === "review"));
  eleventyConfig.addCollection("sessions", () => getDocuments().filter((document) => document.docType === "session"));
  eleventyConfig.addCollection("talks", () => getDocuments().filter((document) => document.docType === "talk"));
  eleventyConfig.addCollection("events", () => getEvents());
}
