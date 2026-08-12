import { postUrl } from "../../../../lib/content-routing.js";

export default {
  type: "article",
  tags: ["articles"],
  permalink: ({ page }) => postUrl(page.fileSlug),
};
