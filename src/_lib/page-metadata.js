const DEFAULT_IMAGE = "/assets/images/default-social.png";
export function plainText(value = "") { return String(value).replace(/<[^>]*>/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[`*_>#~-]/g, " ").replace(/\s+/g, " ").trim(); }
function truncate(value, length = 180) { return value.length <= length ? value : `${value.slice(0, length - 1).replace(/\s+\S*$/, "")}…`; }
function absoluteUrl(value, siteUrl, basePath = "/") { return value ? new URL(value, new URL(basePath, `${siteUrl}/`)).href : null; }
function authoredSource(page = {}) { return String(page.rawInput || "").replace(/^---\s*[\s\S]*?\s*---\s*/, ""); }
function schemaType(type) { return type === "talk" ? "CreativeWork" : ["article", "gamelog", "dungeonlog"].includes(type) ? "BlogPosting" : "WebPage"; }
export function preparePageMetadata(data) {
  const { site, page = {}, title, summary, content, type, date, updated } = data;
  const canonicalUrl = data.robots === "noindex" && data.targetUrl ? absoluteUrl(data.targetUrl, site.url) : data.canonicalUrl || absoluteUrl(page.url || "/", site.url);
  const description = truncate(plainText(summary) || plainText(authoredSource(page)) || plainText(content) || site.description);
  const image = data.resolvedBanner || data.banner;
  const originalImageUrl = absoluteUrl(image?.src || DEFAULT_IMAGE, site.url, page.url || "/");
  const socialImage = data.socialImages?.[new URL(originalImageUrl).pathname];
  const imageUrl = absoluteUrl(socialImage?.src || originalImageUrl, site.url);
  const imageAlt = image?.alt || `${site.title}: software, games, and talks`;
  const fullTitle = title === site.title ? site.title : `${title} | ${site.title}`;
  const contentSchema = { "@type": schemaType(type), headline: title, name: title, description, url: canonicalUrl, image: imageUrl, author: { "@type": "Person", name: site.title, url: site.url }, ...(date ? { datePublished: new Date(date).toISOString() } : {}), ...(updated ? { dateModified: new Date(updated).toISOString() } : {}) };
  const graph = page.url === "/" ? [{ "@type": "WebSite", name: site.title, url: site.url, description: site.description }, { "@type": "Person", name: site.title, url: site.url, sameAs: site.socialLinks.map((item) => item.url) }, contentSchema] : [contentSchema];
  const article = ["article", "gamelog", "dungeonlog"].includes(type);
  return { title: fullTitle, description, canonicalUrl, imageUrl, imageAlt, imageWidth: socialImage?.width || (!image ? 1200 : null), imageHeight: socialImage?.height || (!image ? 630 : null), imageType: socialImage?.type || (!image ? "image/png" : null), openGraphType: article ? "article" : "website", published: article && date ? new Date(date).toISOString() : null, modified: article && updated ? new Date(updated).toISOString() : null, jsonLd: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") };
}
