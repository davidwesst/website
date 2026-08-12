import { postUrl } from "../../../../lib/content-routing.js";

export default {
  type: "dungeonlog",
  tags: ["dungeonlogs"],
  permalink: ({ page }) => postUrl(page.fileSlug),
};
