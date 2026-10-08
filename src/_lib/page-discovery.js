const ARCHIVES = { article: { name: "Articles", url: "/blog/articles/" }, gamelog: { name: "Gamelogs", url: "/blog/gamelogs/" }, dungeonlog: { name: "Dungeonlogs", url: "/blog/dungeonlogs/" }, talk: { name: "Talks", url: "/talks/" } };
export function preparePageDiscovery({ page = {}, title, type, topics = [], topic, discovery }) {
  const url = page.url || "/";
  const breadcrumbs = url === "/" ? [] : [{ name: "Home", url: "/" }];
  if (ARCHIVES[type]) breadcrumbs.push(ARCHIVES[type]);
  else if (url.startsWith("/topics/") && url !== "/topics/") breadcrumbs.push({ name: "Topics", url: "/topics/" });
  else if (url.startsWith("/blog/") && url !== "/blog/") breadcrumbs.push({ name: "Blog", url: "/blog/" });
  if (url !== "/") breadcrumbs.push({ name: title || topic?.name, url });
  const isDevlog = type === "article" && topics.some((value) => value.toLowerCase() === "devlog");
  return { breadcrumbs, showStudio: isDevlog || ["/about/", "/projects/", "/topics/devlog/"].includes(url), intro: topic?.slug === "devlog" ? discovery?.devlogs.description : null };
}
