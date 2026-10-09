function escapeXml(value = "") { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;"); }
export function canonicalItems(items = []) { return [...new Map(items.filter((item) => item.url?.startsWith("/") && item.url.endsWith("/") && !item.data?.robots?.includes("noindex") && !item.data?.targetUrl && !item.url.startsWith("/categories/") && !item.url.startsWith("/legacy/")).map((item) => [item.url, item])).values()].sort((a, b) => a.url.localeCompare(b.url)); }
export function canonicalPageInventory(collections) {
  const indexes = ["/", "/blog/", "/blog/articles/", "/blog/gamelogs/", "/blog/dungeonlogs/", "/talks/", "/topics/"];
  return canonicalItems([...(collections.posts || []), ...(collections.talks || []), ...(collections.pages || []), ...indexes.map((url) => ({ url })), ...(collections.topicPages || []).map((topic) => ({ url: `/topics/${topic.slug}/` }))]);
}
export function reliableModified(item) {
  const authored = item.data?.page?.rawInput ? matter(item.data.page.rawInput).data : item.data || {};
  const value = authored.updated || authored.date;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error(`Invalid sitemap date: ${item.url}`);
  return date.toISOString();
}
export function renderSitemap(items, siteUrl) { const urls = canonicalItems(items).map((item) => { const lastmod = reliableModified(item); return `  <url><loc>${escapeXml(new URL(item.url, siteUrl).href)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`; }).join("\n"); return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`; }
export function renderFeed(items, site, title, description, feedPath) { const feedUrl = new URL(feedPath, site.url).href; const entries = [...items].sort((a, b) => b.date - a.date).map((item) => `<entry><title>${escapeXml(item.data.title)}</title><link href="${escapeXml(new URL(item.url, site.url).href)}"/><id>${escapeXml(new URL(item.url, site.url).href)}</id><updated>${new Date(item.data.updated || item.date).toISOString()}</updated><summary>${escapeXml(item.data.summary || "")}</summary></entry>`).join("\n"); const updated = items.length ? new Date(Math.max(...items.map((item) => new Date(item.data.updated || item.date).valueOf()))).toISOString() : new Date(0).toISOString(); return `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><title>${escapeXml(title)}</title><subtitle>${escapeXml(description)}</subtitle><link href="${escapeXml(feedUrl)}" rel="self"/><link href="${escapeXml(site.url)}"/><id>${escapeXml(feedUrl)}</id><updated>${updated}</updated><author><name>${escapeXml(site.title)}</name><uri>${escapeXml(site.url)}</uri></author>${entries}</feed>`; }
import matter from "gray-matter";
