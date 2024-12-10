import { EleventyRenderPlugin, EleventyHtmlBasePlugin } from "@11ty/eleventy";

import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginWebc from "@11ty/eleventy-plugin-webc";
import pluginImage from "@11ty/eleventy-img";

export default async function (eleventyConfig) {
    // setup directories
    eleventyConfig.setInputDirectory("src");
    eleventyConfig.setOutputDirectory("dist");
    eleventyConfig.setLayoutsDirectory("_layouts");
    eleventyConfig.setIncludesDirectory("_includes");

    // setup passthrough directories
    eleventyConfig.addPassthroughCopy({
        "src/static/": "/static"
    });

    // do not use .gitignore for generation
    eleventyConfig.setUseGitIgnore(false);

    //
    //  Plugins
    //

    // rss
    eleventyConfig.addPlugin(feedPlugin, {
        type: "atom",
        outputPath: "/feed.xml",
        collection: {
            name: "blog", 
            limit: 0
        },
        metadata: {
            language: "en",
            title: "Blog by David Wesst",
            subtitle: "A blog about things I enjoy, namely video games, software development, and video game software development",
            base: "https://davidwesst.com/",
            author: {
                name: "David Wesst",
                email: ""
            }
        }
    });

    // render
    //eleventyConfig.addPlugin(EleventyRenderPlugin);

    // webc
    eleventyConfig.addPlugin(pluginWebc, {
        components: [
            "src/_includes/components/*.webc",
            "src/_layouts/*.webc",
            "src/*.webc",
            "src:@11ty/eleventy-img/*.webc"
        ]
    });

    // image
    eleventyConfig.addPlugin(pluginImage.eleventyImageTransformPlugin, {
        formats: ["webp", "jpeg"],
        urlPath: "/img/",
        defaultAttributes: {
            loading: "lazy",
            decoding: "async"
        }
    });

    //
    // Filters
    //

    eleventyConfig.addFilter("formatDate", (value) => {  
        const date = new Date(value);
        const dateOptions = { month: "long", day: "numeric", year: "numeric" };
        const dateString = date.toLocaleDateString("en-CA", dateOptions);

        return dateString;
    });
};