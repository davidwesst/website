export default class SitemapPage {
  data() {
    return {
      permalink: "/sitemap.xml",
      eleventyExcludeFromCollections: true,
    };
  }

  async render(data) {
    return this.sitemap(data.collections.sitePages);
  }
}
