export const POST_TYPES = new Set(["article", "articles", "gamelog", "gamelogs", "dungeonlog", "dungeonlogs"]);
export const BLOG_INDEX_ROUTES = Object.freeze({
  articles: "/blog/articles/",
  gamelogs: "/blog/gamelogs/",
  dungeonlogs: "/blog/dungeonlogs/",
});
export const RESERVED_BLOG_SLUGS = new Set(Object.values(BLOG_INDEX_ROUTES).map((url) => url.split("/").filter(Boolean).at(-1)));

export function postUrl(slug) {
  return `/blog/${slug}/`;
}

export function canonicalContentUrl(type, slug) {
  if (POST_TYPES.has(type)) return postUrl(slug);
  if (type === "talk" || type === "talks") return `/talks/${slug}/`;
  if (type === "page" || type === "pages") return `/${slug}/`;
  throw new Error(`Unknown content type: ${type}`);
}

export function canonicalAssetDirectory(relativeFile) {
  const segments = String(relativeFile).replaceAll("\\", "/").split("/");
  if (segments[0] === "posts" && ["articles", "gamelogs", "dungeonlogs"].includes(segments[1])) return `blog/${segments[2]}`;
  if (segments[0] === "talks") return `talks/${segments[1]}`;
  if (segments[0] === "pages") return segments[1];
  throw new Error(`Cannot determine output route for colocated asset: ${relativeFile}`);
}
