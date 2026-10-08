import { canonicalPageInventory, renderSitemap } from "./_lib/discovery-documents.js";
export default class {
  data() { return { permalink: "/sitemap.xml", eleventyExcludeFromCollections: true }; }
  render({ collections, site }) { return renderSitemap(canonicalPageInventory(collections), site.url); }
}
