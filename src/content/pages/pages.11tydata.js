export default {
  layout: "page.webc",
  type: "page",
  tags: ["pages"],
  permalink: ({ page }) => `/${page.fileSlug}/`,
};
