import { renderMarkdown } from "./_lib/render-markdown.js";

export default {
  pagination: {
    data: "collections.pages",
    size: 1,
    alias: "contentPage",
  },
  layout: "base.webc",
  eleventyComputed: {
    title(data) {
      return data.contentPage.title;
    },
    renderedBody(data) {
      return renderMarkdown(data.contentPage.body.markdown);
    },
  },
  permalink(data) {
    return data.contentPage.canonicalUrl;
  },
};
