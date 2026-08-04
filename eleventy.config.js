import pluginWebc from "@11ty/eleventy-plugin-webc";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginWebc);
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_includes/layouts");
  eleventyConfig.setOutputDirectory("_site");
}
