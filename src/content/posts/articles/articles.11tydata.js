export default {
  type: "article",
  tags: ["articles"],
  permalink: ({ page }) => `/blog/${page.fileSlug}/`,
};
