const ARCHIVES = { article: "/blog/articles/", gamelog: "/blog/gamelogs/", dungeonlog: "/blog/dungeonlogs/", talk: "/talks/" };
function sharedTopicCount(left = [], right = []) { const rightSet = new Set(right.map((topic) => topic.toLowerCase())); return new Set(left.map((topic) => topic.toLowerCase()).filter((topic) => rightSet.has(topic))).size; }
export function prepareContentNavigation(items, currentUrl, type, topics = [], limit = 3) {
  const canonical = [...(items || [])].filter((item) => item.url && !item.data?.robots && !item.data?.targetUrl);
  const related = canonical.filter((item) => item.url !== currentUrl).map((item) => ({ item, shared: sharedTopicCount(topics, item.data.topics) })).filter(({ shared }) => shared > 0).sort((left, right) => right.shared - left.shared || Number(right.item.data.type === type) - Number(left.item.data.type === type) || right.item.date - left.item.date || left.item.url.localeCompare(right.item.url)).slice(0, limit).map(({ item }) => item);
  const family = canonical.filter((item) => item.data.type === type).sort((left, right) => left.date - right.date || left.url.localeCompare(right.url));
  const index = family.findIndex((item) => item.url === currentUrl);
  return { related, previous: index > 0 ? family[index - 1] : null, next: index >= 0 && index < family.length - 1 ? family[index + 1] : null, archiveUrl: ARCHIVES[type] || "/blog/", type, topics };
}
