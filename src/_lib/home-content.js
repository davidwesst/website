function decodeHtmlEntities(value) {
  const namedEntities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)))
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 10)))
    .replace(/&([a-z]+);/gi, (entity, name) => namedEntities[name.toLowerCase()] ?? entity);
}

function textFromParagraph(html) {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function getPostDescription(post) {
  const summary = post?.data?.summary?.trim();
  if (summary) return summary;

  const paragraphs = [...(post?.templateContent || "").matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
    .map((match) => textFromParagraph(match[1]))
    .filter(Boolean);

  const introduction = [];
  for (const paragraph of paragraphs) {
    introduction.push(paragraph);
    if (introduction.join(" ").length >= 120 || introduction.length === 3) break;
  }

  return introduction.join(" ") || null;
}

export function prepareHomeContent(posts, configuredUrl, recentPostCount) {
  const sorted = [...(posts || [])].filter((item) => item.data?.type !== "dungeonlog").sort((left, right) => right.date - left.date);
  if (!sorted.length) throw new Error("The home page requires at least one post");

  const featured = configuredUrl
    ? sorted.find((post) => post.url === configuredUrl)
    : sorted[0];

  if (!featured) throw new Error(`Configured featured post was not found: ${configuredUrl}`);

  return {
    featured,
    featuredDescription: getPostDescription(featured),
    recent: sorted.filter((post) => post.url !== featured.url).slice(0, recentPostCount),
    sections: Object.fromEntries(["article", "gamelog", "talk"].map((type) => [type, sorted.filter((item) => item.data?.type === type && item.url !== featured.url).slice(0, recentPostCount)])),
  };
}
