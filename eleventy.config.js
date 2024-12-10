import { InputPathToUrlTransformPlugin } from "@11ty/eleventy";

import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginWebc from "@11ty/eleventy-plugin-webc";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

export default function (eleventyConfig) {
    
    eleventyConfig.setInputDirectory("content");
    eleventyConfig.setOutputDirectory("_site");
    eleventyConfig.setDataDirectory("../data");
    eleventyConfig.setLayoutsDirectory("../layouts");

    /*
        Plugins
    */
    
    eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

    eleventyConfig.addPlugin(feedPlugin, {
        type: "atom",
        outputPath: "/feed.xml",
        collection: {
            name: "blog",
            limit: 10    
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

    eleventyConfig.addPlugin(pluginWebc, {
        components: [
            "./components/**/*.webc"
        ]
    });

    eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        extensions: "html",
        formats: ["webp", "jpeg"],
        widths: [160, 1200],
        defaultAttributes: {
            sizes: "160w, 1200w",
            loading: "lazy",
            decoding: "async"
        }
    });
    
}