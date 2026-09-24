// Shared route model; hosting adapters own provider syntax, not content policy.
export const LEGACY_GAMELOG_REWRITE = {
  route: "/blog/gamelog/entry.html", rewrite: "/legacy/gamelog-entry.html",
};

export function hostingRoutes(items) {
  const routes = new Map([[LEGACY_GAMELOG_REWRITE.route, LEGACY_GAMELOG_REWRITE]]);
  function add(source, target) {
    if (source.includes("?") || source === target) return;
    const existing = routes.get(source);
    if (existing && existing.redirect !== target) throw new Error(`Conflicting redirect: ${source}`);
    routes.set(source, { route: source, redirect: target, statusCode: 301 });
  }
  for (const item of items) {
    if (!item.url || !Array.isArray(item.data.redirectFrom)) continue;
    for (const source of item.data.redirectFrom) add(source, item.url);
  }
  for (const [source, target] of [
    ["/blog.html", "/blog/"],
    ["/blog/gamelog.html", "/blog/gamelogs/"],
    ["/blog/gamelog/", "/blog/gamelogs/"],
    ["/blog/dungeonlog.html", "/blog/dungeonlogs/"],
    ["/blog/dungeonlog/", "/blog/dungeonlogs/"],
  ]) add(source, target);
  return [...routes.values()];
}

export function cloudflareRedirects(routes) {
  const lines = routes.map(({ route, redirect, rewrite, statusCode }) => `${route} ${redirect || rewrite} ${statusCode || 200}`);
  if (lines.length > 2000) throw new Error("Cloudflare static redirect limit exceeded");
  if (lines.some((line) => line.length > 1000)) throw new Error("Cloudflare redirect line limit exceeded");
  return `${lines.join("\n")}\n`;
}
