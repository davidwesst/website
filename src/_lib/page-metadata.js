const DEFAULT_IMAGE = "/assets/images/default-social.png";
import { preparePageSchema } from "./page-schema.js";
export function plainText(value = "") { return String(value).replace(/<[^>]*>/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[`*_>#~-]/g, " ").replace(/\s+/g, " ").trim(); }
function truncate(value, length = 180) { return value.length <= length ? value : `${value.slice(0, length - 1).replace(/\s+\S*$/, "")}…`; }
function absoluteUrl(value, siteUrl, basePath = "/") { return value ? new URL(value, new URL(basePath, `${siteUrl}/`)).href : null; }
function authoredSource(page = {}) { return String(page.rawInput || "").replace(/^---\s*[\s\S]*?\s*---\s*/, ""); }
export function preparePageMetadata(data) {
  const { site, page = {}, title, summary, content, type, date, updated } = data;
  const canonicalUrl = data.robots === "noindex" && data.targetUrl ? absoluteUrl(data.targetUrl, site.url) : data.canonicalUrl || absoluteUrl(page.url || "/", site.url);
  const description = truncate(plainText(data.discovery?.descriptions[page.url]) || plainText(summary) || (data.topic ? `Articles and talks by ${site.title} about ${data.topic.name}.` : "") || plainText(authoredSource(page)) || plainText(content) || site.description);
  const image = data.resolvedBanner || data.banner;
  const originalImageUrl = absoluteUrl(image?.src || DEFAULT_IMAGE, site.url, page.url || "/");
  const socialImage = data.socialImages?.[new URL(originalImageUrl).pathname];
  const imageUrl = absoluteUrl(socialImage?.src || originalImageUrl, site.url);
  const imageAlt = image?.alt || `${site.title}: software, games, and talks`;
  const fullTitle = title === site.title ? site.title : `${title} | ${site.title}`;
  const article = ["article", "gamelog", "dungeonlog"].includes(type);
  return { title: fullTitle, description, canonicalUrl, imageUrl, imageAlt, imageWidth: socialImage?.width || (!image ? 1200 : null), imageHeight: socialImage?.height || (!image ? 630 : null), imageType: socialImage?.type || (!image ? "image/png" : null), openGraphType: article ? "article" : "website", published: article && date ? new Date(date).toISOString() : null, modified: article && updated ? new Date(updated).toISOString() : null, jsonLd: preparePageSchema(data, { canonicalUrl, description, imageUrl }) };
}
