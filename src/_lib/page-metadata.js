const DEFAULT_IMAGE = "/assets/images/default-social.png";
export function plainText(value = "") { return String(value).replace(/<[^>]*>/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[`*_>#~-]/g, " ").replace(/\s+/g, " ").trim(); }
function truncate(value, length = 180) { return value.length <= length ? value : `${value.slice(0, length - 1).replace(/\s+\S*$/, "")}…`; }
function absoluteUrl(value, siteUrl, basePath = "/") { return value ? new URL(value, new URL(basePath, `${siteUrl}/`)).href : null; }
function schemaType(type) { return type === "talk" ? "CreativeWork" : ["article", "gamelog", "dungeonlog"].includes(type) ? "BlogPosting" : "WebPage"; }
export function preparePageMetadata(data) {
  const { site, page = {}, title, summary, content, type, date, updated } = data;
  const canonicalUrl = data.robots === "noindex" && data.targetUrl ? absoluteUrl(data.targetUrl, site.url) : data.canonicalUrl || absoluteUrl(page.url || "/", site.url);
  const description = truncate(plainText(summary) || plainText(content) || site.description);
  const image = data.resolvedBanner || data.banner;
  const imageUrl = absoluteUrl(image?.src || DEFAULT_IMAGE, site.url, page.url || "/");
  const imageAlt = image?.alt || `${site.title}: software, games, and talks`;
  const fullTitle = title === site.title ? site.title : `${title} | ${site.title}`;
  const contentSchema = { "@type": schemaType(type), headline: title, name: title, description, url: canonicalUrl, image: imageUrl, author: { "@type": "Person", name: site.title, url: site.url }, ...(date ? { datePublished: new Date(date).toISOString() } : {}), ...(updated ? { dateModified: new Date(updated).toISOString() } : {}) };
  const graph = page.url === "/" ? [{ "@type": "WebSite", name: site.title, url: site.url, description: site.description }, { "@type": "Person", name: site.title, url: site.url, sameAs: site.socialLinks.map((item) => item.url) }, contentSchema] : [contentSchema];
  return { title: fullTitle, description, canonicalUrl, imageUrl, imageAlt, openGraphType: ["article", "gamelog", "dungeonlog"].includes(type) ? "article" : "website", published: date ? new Date(date).toISOString() : null, modified: updated ? new Date(updated).toISOString() : null, jsonLd: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") };
}
