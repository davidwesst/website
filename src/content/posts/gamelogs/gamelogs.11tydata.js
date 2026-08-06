import { postUrl } from "../../../../lib/content-routing.js";

export default {
  type: "gamelog",
  tags: ["gamelogs"],
  permalink: ({ page }) => postUrl(page.fileSlug),
};
