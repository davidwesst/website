#!/usr/bin/env node

import fs from "fs/promises";
import matter from "gray-matter";
import path from "path";

import { normalizeTagName } from "./lib/tags.js";

/**
 * Convert the tag collection to a JSON string
 * @param {Set} tagCollection
 * @param {Object} options whitespace: true/false 
 */
function tagCollectionToString(tagCollection, options) {
    let dataStr = JSON.stringify(Array.from(tagCollection).sort());
    if(options?.whitespace == true) {
        dataStr = dataStr
                    .replaceAll("[","[\n\t")
                    .replaceAll(",",",\n\t")
                    .replaceAll("]","\n]");
    }
    return dataStr;
}

async function createTagDataFile() {
    // process arguments
    const [,,...args] = process.argv;
    const postDirPath = args[0] || "content/blog/";
    const tagFileOutputPath = args[1] || "data/content-tags.json";

    // read all index.md files in directory and subdirectories
    const posts = await fs.readdir(postDirPath);
    const tags = new Set();
    for(const p of posts) {
        const pStat = await fs.lstat(path.join(postDirPath, p));
        if(await pStat.isDirectory()) {
            // parse front matter to get tags
            const postFilePath = path.join(postDirPath, p, "index.md");
            const postFile = await fs.readFile(postFilePath);
            const { data: frontMatter, content } = await matter(postFile);
            if(frontMatter["tags"]) {
                // add tags for each post to a set 
                for(const tag of frontMatter["tags"]) {
                    tags.add(normalizeTagName(tag));
                }
            }
        }
    }

    // output map contents to json file
    try {
        await fs.writeFile(tagFileOutputPath, tagCollectionToString(tags, { whitespace: true }), { flag: "w"});
    } catch {
        console.error(`ERROR: Tag file ${tagFileOutputPath} already exists.`);
    }
};

Promise.resolve(createTagDataFile());