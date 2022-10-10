const pluginRss = require("@11ty/eleventy-plugin-rss");

const markdownIt = require("markdown-it");
const markdownItEmoji = require("markdown-it-emoji");
//const markdownItImages = require("markdown-it-eleventy-img");
const markdownItImages = require("markdown-it-eleventy-img");

const path = require("path");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.setUseGitIgnore(false);
  eleventyConfig.addPassthroughCopy("./src/assets/");

  // configure markdown templates
  const mdOptions = {
    html: true,
    break: true,
    linkify: true
  };
  let mdLibrary = markdownIt(mdOptions)
                  .use(markdownItEmoji)
                  .use(markdownItImages, {
                    imgOptions: {
                      widths: [300, 500, 800],
                      urlPath: "/img/",
                      outputDir: path.join("dist/img/"),
                      formats: ["avif", "webp", "jpeg"]
                    },
                    globalAttributes: {
                      sizes: "100vw"
                    },
                    eleventyResolveToProjectRoot: false 
                  });
  eleventyConfig.setLibrary("md", mdLibrary);

  return {
    dir: {
        input: "src",
        output: "dist",
        layouts: "_layouts"
    },
    passthroughFileCopy: true
  }
}