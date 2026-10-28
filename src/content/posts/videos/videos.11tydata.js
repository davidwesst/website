import { postUrl } from "../../../../lib/content-routing.js";

export default {
  type: "video",
  tags: ["videos"],
  permalink: ({ page }) => postUrl(page.fileSlug),
};
