import { postUrl } from "../../../../lib/content-routing.js";

export default {
  type: "gamelog",
  tags: ["gamelogs"],
  permalink: ({ page }) => postUrl(page.fileSlug),
  eleventyComputed: {
    gameMetadata: (data) => data.igdbGames?.[data.customData?.game?.ids?.igdb] || null,
    resolvedBanner: (data) => data.banner || data.igdbGames?.[data.customData?.game?.ids?.igdb]?.banner || null,
  },
};
