import pluginWebc from "@11ty/eleventy-plugin-webc";
import sitemapPlugin from "@quasibit/eleventy-plugin-sitemap";
import site from "./src/_data/site.js";

export default function(eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_includes/layouts");
  eleventyConfig.setOutputDirectory("_site");

  eleventyConfig.addPlugin(sitemapPlugin, {
    sitemap: {
      hostname: site.url,
    },
  });

  eleventyConfig.addPlugin(pluginWebc, {
    components: "src/_includes/components/**/*.webc",
  });

  eleventyConfig.addCollection("sitePages", (collectionApi) => {
    return collectionApi
      .getAll()
      .filter((item) => item.url && item.outputPath && !item.data.eleventyExcludeFromCollections);
  });
}
