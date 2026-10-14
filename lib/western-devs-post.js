import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import matter from "gray-matter";
import { load } from "cheerio";
import { postUrl } from "./content-routing.js";

function inside(root, file) {
  const resolved = path.resolve(root, file);
  assert.ok(resolved.startsWith(`${path.resolve(root)}${path.sep}`), "Asset must remain inside the release artifact");
  return resolved;
}

function authoredDate(source, field, fallback) {
  // gray-matter converts unquoted YAML timestamps to Dates; retain their spelling.
  const match = matter(source, { excerpt: false }).matter.match(new RegExp(`^${field}:\\s*(.+?)\\s*$`, "m"));
  if (!match) return fallback;
  const value = String(matter(`---\nvalue: ${match[1]}\n---`).data.value);
  const raw = match[1].replace(/\s+#.*$/, "").replace(/^(['"])(.*)\1$/, "$2");
  assert.ok(!Number.isNaN(Date.parse(value)) || !Number.isNaN(Date.parse(raw)), `Invalid ${field}`);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw;
}

export function describeWesternDevsPost({ source, candidate, origin }) {
  const { data } = matter(source);
  const route = postUrl(candidate.file.split("/").at(-2));
  const canonical = new URL(route, origin).href;
  return { id: candidate.id, title: data.title, canonical, aliases: [
    canonical, ...[origin, "https://www.davidwesst.com", "http://www.davidwesst.com", "https://davidwesst.com", "http://davidwesst.com"]
      .flatMap((base) => [route, postUrl(candidate.originalPath.split("/").at(-2))].map((url) => new URL(url, base).href)),
    ...(data.redirectFrom || []).flatMap((url) => [origin, "https://www.davidwesst.com", "http://www.davidwesst.com"].map((base) => new URL(url, base).href)),
  ] };
}

// Export only the authored article region from the verified release. This reuses
// Eleventy's Markdown rendering, including reference links and literal code.
export async function convertWesternDevsPost({ root, siteRoot, origin, candidate, release, authorId = "david_wesst" }) {
  const source = await readFile(path.join(root, candidate.file), "utf8");
  const { data } = matter(source);
  assert.equal(data.type || "article", "article", "Only articles can be crossposted");
  assert.ok(typeof data.title === "string" && data.title, "An article title is required");
  const slug = candidate.file.split("/").at(-2);
  const route = postUrl(slug);
  const canonical = new URL(route, origin).href;
  const page = load(await readFile(inside(siteRoot, `${route.slice(1)}index.html`), "utf8"));
  assert.equal(page('link[rel="canonical"]').attr("href"), canonical, "Built canonical must match source article");
  const section = page('article section[aria-label="Post content"]');
  assert.equal(section.length, 1, "Release must contain one authored article body");
  const description = page('meta[name="description"]').attr("content");
  assert.ok(description, "Release must contain a description");
  const date = authoredDate(source, "date");
  assert.ok(date, "An explicit publication date is required");
  const basename = `${date.slice(0, 10)}-david-wesst-${slug}`;
  const imageDirectory = `/images/david-wesst/${basename}`;
  const parts = [];
  if (data.banner) {
    const banner = page("article figure.post-visual").first().clone();
    const image = banner.find("img");
    assert.equal(image.length, 1, "Authored banner must be present in the release");
    // Export the original image without the source site's figure wrapper/margins.
    parts.push(page.html(image));
    const caption = banner.find("figcaption");
    if (caption.length) parts.push(page.html(page("<p></p>").append(caption.contents())));
  }
  if (data.summary) parts.push(`<p>${String(data.summary).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</p>`);
  parts.push(section.html());
  const body = load(parts.join("\n"), {}, false);
  assert.equal(body("script, style, base").length, 0, "Executable or style elements require manual crossposting");
  // Responsive derivatives are source-site presentation. Copy original fallbacks.
  for (const picture of body("picture").toArray()) {
    const image = body(picture).find("img");
    assert.equal(image.length, 1, "Unsupported picture without an original image");
    body(picture).replaceWith(image);
  }
  const assets = new Map();
  const owned = new URL(route, origin);
  async function rewrite(value, copyImage = false) {
    if (!value || value.startsWith("#") || /^(?:mailto:|tel:|data:)/i.test(value)) return value;
    const url = new URL(value, canonical);
    assert.ok(["http:", "https:"].includes(url.protocol), "Unsupported URL protocol");
    if (copyImage && url.origin === owned.origin && url.pathname.startsWith(route)) {
      const relative = decodeURIComponent(url.pathname.slice(1));
      const bytes = await readFile(inside(siteRoot, relative));
      const name = `${createHash("sha256").update(bytes).digest("hex").slice(0, 16)}-${path.posix.basename(relative)}`;
      const destination = `${imageDirectory}/${name}`;
      assets.set(`source${destination}`, bytes);
      return `${destination}${url.search}${url.hash}`;
    }
    return url.href;
  }
  for (const element of body("*").toArray()) {
    const node = body(element);
    // Let the target theme size images at their natural aspect ratio. Its width
    // limits do not reset source-site height attributes when an image shrinks.
    node.removeAttr("class");
    if (node.is("img")) node.removeAttr("srcset sizes loading width height");
    for (const attribute of ["href", "src", "poster", "cite"]) {
      const value = node.attr(attribute);
      if (value) node.attr(attribute, await rewrite(value, node.is("img") && attribute === "src"));
    }
    assert.ok(!node.attr("srcset"), "Unsupported responsive media requires manual crossposting");
  }
  const topics = data.topics || [];
  assert.ok(Array.isArray(topics) && topics.every((topic) => typeof topic === "string" && topic.trim()), "Topics must be nonempty strings");
  const metadata = {
    layout: "post", title: data.title, date,
    updated: authoredDate(source, "updated", date), authorId,
    tags: topics, ...(topics.length ? { categories: [topics[0]] } : {}),
    excerpt: data.summary || description, description, originalurl: canonical,
    crosspostId: candidate.id, sourceCommit: release.commit, sourceBuildId: release.buildId,
  };
  // Hexo 4 runs Nunjucks after Markdown. Encode literal braces in HTML text and
  // attributes so code samples cannot become template expressions or raw endings.
  const html = body.html().replaceAll("{", "&#123;").replaceAll("}", "&#125;");
  const markdown = matter.stringify(`\n{% raw %}\n${html}\n{% endraw %}\n`, metadata);
  return {
    ...describeWesternDevsPost({ source, candidate, origin }),
    files: [{ path: `source/_posts/${basename}.md`, bytes: Buffer.from(markdown) },
      ...[...assets].map(([file, bytes]) => ({ path: file, bytes }))],
  };
}
