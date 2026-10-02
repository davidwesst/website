// Confirmed by authored referring links and the current content inventory (#59).
export const CONTENT_REDIRECT_REPAIRS = [
  ["/answering-the-question-when-will-ie-support-that-html-feature", "/blog/answering-the-question-when-will-ie-support-that-html-feature/"],
  ["/talks/cots-to-cloud", "/talks/from-custom-cots-to-cloud/"],
  ["/html-gaming-for-core-gamers", "/blog/html-gaming-for-core-gamers/"],
  ["/script-unscripted-starts-january-8th-2015", "/blog/script-unscripted-starts-january-8th/"],
  ["/get-to-the-point-video-is-up", "/blog/get-to-the-point-my-pilot-video/"],
  ["/stop-hating-ie-and-be-a-professional-part-1", "/blog/stop-hating-ie-and-be-a-professional-part-1/"],
  ["/stop-hating-ie-and-be-a-professional-part-2", "/blog/stop-hating-ie-and-be-a-professional-part-2/"],
  ["/stop-hating-ie-and-be-a-professional-part-3", "/blog/stop-hating-ie-and-be-a-professional-part-3/"],
  ["/can-asp-net-become-the-next-node-js", "/blog/can-asp-net-become-the-next-node-js/"],
  ["/always-use-node", "/blog/always-use-node-even-on-non-node-projects/"],
  ["/why-do-i-javascript", "/blog/why-do-i-javascript/"],
  ["/humble-bundle-games-go-javascript", "/blog/humble-bundle-games-go-javascript/"],
  ["/the-difference-between-apps-and-games", "/blog/the-difference-between-apps-and-games/"],
  // Their slash forms already exist in authored redirectFrom; only the
  // observed missing forms require additional provider rules.
  ["/blog/gamelog/blue-prince", "/blog/blue-prince/"],
  ["/gamelog/blue-prince", "/blog/blue-prince/"],
  ["/gamelog/sagres", "/blog/sagres/"],
  ["/remember-the-human", "/projects/"],
].flatMap(([source, target]) => [[source, target], [`${source}/`, target]]);

// The MVP link is authored in highlight-reel-for-2022; the feed permalinks
// are recorded in 9447db9^:src/blog/{,gamelog/,dungeonlog/}feed.11ty.js.
export const SHARED_REDIRECT_REPAIRS = [
  ["/tags/mvp", "/topics/mvp/"],
  ["/tags/mvp/", "/topics/mvp/"],
  ["/blog/feed.xml", "/blog/articles/feed.xml"],
  ["/blog/gamelog/feed.xml", "/blog/gamelogs/feed.xml"],
  ["/blog/dungeonlog/feed.xml", "/blog/dungeonlogs/feed.xml"],
];

export const CONFIRMED_REDIRECT_REPAIRS = [...CONTENT_REDIRECT_REPAIRS, ...SHARED_REDIRECT_REPAIRS];
const targets = new Map(CONFIRMED_REDIRECT_REPAIRS);

export function repairedContentAliases(canonical) {
  return CONTENT_REDIRECT_REPAIRS.filter(([, target]) => target === canonical).map(([source]) => source);
}

// Used by the one-time migration tool so regeneration retains the repairs.
export function repairLegacyBodyLinks(body) {
  return body.split("\n").map((line) => {
    const repaired = line.replace(/https?:\/\/(?:www\.)?davidwesst\.com[^\s"'<>()[\]]*/gi, (reference) => {
      const url = new URL(reference);
      if (!["davidwesst.com", "www.davidwesst.com"].includes(url.hostname)) return reference;
      const target = targets.get(url.pathname);
      if (target) return `${target}${url.search}${url.hash}`;
      if (/^\/\/www\.youtube\.com\/embed\/[\w-]{11}$/.test(url.pathname)) {
        return `https:${url.pathname}${url.search}${url.hash}`;
      }
      return reference;
    });
    if (repaired === line) return line;
    return `${repaired.trimEnd()}${/ {2,}$/.test(line) ? "\\" : ""}`;
  }).join("\n");
}
