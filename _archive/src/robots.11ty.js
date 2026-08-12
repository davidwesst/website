export default class RobotsPage {
  data() {
    return {
      permalink: "/robots.txt",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    return `User-agent: *
Allow: /

Sitemap: ${data.site.url}/sitemap.xml
`;
  }
}
