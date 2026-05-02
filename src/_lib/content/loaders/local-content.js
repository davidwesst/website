import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SOURCE = "website";
const TALK_ROOT = path.resolve("src/content/talks");
const EVENT_ROOT = path.resolve("src/content/events");
const POST_ROOT = path.resolve("src/content/posts");

function discoverAssets(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name !== "index.md")
    .map((entry) => path.join(directory, entry.name));
}

export function loadTalks({ root = TALK_ROOT } = {}) {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const directory = path.join(root, entry.name);
      const nativePath = path.join(directory, "index.md");

      if (!fs.existsSync(nativePath)) {
        return null;
      }

      const parsed = matter(fs.readFileSync(nativePath, "utf8"));

      return {
        source: SOURCE,
        type: "talk",
        slug: parsed.data.slug || entry.name,
        nativePath,
        body: parsed.content.trim(),
        data: parsed.data,
        assets: discoverAssets(directory),
      };
    })
    .filter(Boolean);
}

export function loadEvents({ root = EVENT_ROOT } = {}) {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const nativePath = path.join(root, entry.name, "index.json");

      if (!fs.existsSync(nativePath)) {
        return null;
      }

      return {
        source: SOURCE,
        nativePath,
        data: JSON.parse(fs.readFileSync(nativePath, "utf8")),
      };
    })
    .filter(Boolean);
}

export function loadPosts({ root = POST_ROOT } = {}) {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((seriesEntry) => {
      const seriesRoot = path.join(root, seriesEntry.name);

      return fs
        .readdirSync(seriesRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
          const directory = path.join(seriesRoot, entry.name);
          const nativePath = path.join(directory, "index.md");

          if (!fs.existsSync(nativePath)) {
            return null;
          }

          const parsed = matter(fs.readFileSync(nativePath, "utf8"));

          return {
            source: parsed.data.source || SOURCE,
            type: parsed.data.docType || "post",
            slug: parsed.data.slug || entry.name,
            nativePath,
            body: parsed.content.trim(),
            data: parsed.data,
            assets: discoverAssets(directory),
          };
        })
        .filter(Boolean);
    });
}
