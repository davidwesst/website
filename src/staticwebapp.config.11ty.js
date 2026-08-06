function canonicalFor(item) {
  return item.url;
}

function isCoveredByTrailingSlash(source, target) {
  return source.endsWith("/index.html") && source.slice(0, -"index.html".length) === target;
}

export default class StaticWebAppConfig {
  data() {
    return {
      permalink: "/staticwebapp.config.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const routes = [{ route: "/blog/gamelog/entry.html", rewrite: "/legacy/gamelog-entry.html" }];
    const seen = new Set(routes.map((route) => route.route));

    for (const item of data.collections.all) {
      const target = canonicalFor(item);
      if (!target || !Array.isArray(item.data.redirectFrom)) continue;
      for (const source of item.data.redirectFrom) {
        if (source.includes("?") || isCoveredByTrailingSlash(source, target) || seen.has(source)) continue;
        if (source === target) continue;
        routes.push({ route: source, redirect: target, statusCode: 301 });
        seen.add(source);
      }
    }

    for (const route of [
      { route: "/blog.html", redirect: "/blog/", statusCode: 301 },
      { route: "/blog/gamelog.html", redirect: "/blog/gamelogs/", statusCode: 301 },
      { route: "/blog/gamelog/", redirect: "/blog/gamelogs/", statusCode: 301 },
      { route: "/blog/dungeonlog.html", redirect: "/blog/dungeonlogs/", statusCode: 301 },
      { route: "/blog/dungeonlog/", redirect: "/blog/dungeonlogs/", statusCode: 301 },
    ]) {
      if (!seen.has(route.route)) routes.push(route);
    }

    const output = JSON.stringify({ trailingSlash: "always", routes }, null, 2);
    if (Buffer.byteLength(output) > 20 * 1024) throw new Error("staticwebapp.config.json exceeds Azure's 20 KB limit");
    return output;
  }
}
