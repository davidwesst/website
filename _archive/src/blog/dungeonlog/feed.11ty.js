function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(site, path) {
  return new URL(path, site.url).toString();
}

export default class DungeonlogFeed {
  data() {
    return {
      permalink: "/blog/dungeonlog/feed.xml",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const posts = data.collections.posts.filter((post) => post.series === "dungeonlog");

    return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(data.site.title)} Dungeonlog</title>
    <link>${escapeXml(absoluteUrl(data.site, "/blog/?series=dungeonlog"))}</link>
    <description>${escapeXml(data.site.description)}</description>
    ${posts
      .map(
        (post) => `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(absoluteUrl(data.site, post.canonicalUrl))}</link>
      <guid>${escapeXml(absoluteUrl(data.site, post.canonicalUrl))}</guid>
      ${post.dates?.published ? `<pubDate>${escapeXml(new Date(post.dates.published).toUTCString())}</pubDate>` : ""}
      ${post.summary ? `<description>${escapeXml(post.summary)}</description>` : ""}
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;
  }
}
