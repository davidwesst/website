import { preparePageDiscovery } from "./page-discovery.js";

export function preparePageSchema(data, { canonicalUrl, description, imageUrl }) {
  const { site, page = {}, title, type, date, updated, discovery } = data;
  const personId = `${site.url}/#person`;
  const person = {
    "@type": "Person", "@id": personId, name: site.title, url: `${site.url}/about/`,
    sameAs: (site.socialLinks || []).map((item) => item.url),
  };
  if (discovery?.studio) person.affiliation = {
    "@type": "Organization", "@id": `${discovery.studio.url}/#organization`,
    name: discovery.studio.name, url: discovery.studio.url, founder: { "@id": personId },
  };
  const authored = ["article", "gamelog", "dungeonlog", "talk"].includes(type);
  const schemaType = page.url === "/about/" ? "ProfilePage" : type === "talk" ? "CreativeWork" : authored ? "BlogPosting" : "WebPage";
  const content = {
    "@type": schemaType, "@id": `${canonicalUrl}#page`, headline: title, name: title,
    description, url: canonicalUrl, image: imageUrl, author: { "@id": personId },
  };
  if (page.url === "/about/") content.mainEntity = { "@id": personId };
  if (authored && date) content.datePublished = new Date(date).toISOString();
  if (updated) content.dateModified = new Date(updated).toISOString();
  const graph = [content, person];
  if (page.url === "/") graph.push({ "@type": "WebSite", "@id": `${site.url}/#website`, name: site.title, url: site.url, description: site.description });
  const breadcrumbs = preparePageDiscovery(data).breadcrumbs;
  if (breadcrumbs.length) graph.push({
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: new URL(item.url, site.url).href })),
  });
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}
