import { renderMarkdown } from "../_lib/render-markdown.js";

export default {
  pagination: {
    data: "collections.posts",
    size: 1,
    alias: "post",
  },
  layout: "base.webc",
  eleventyExcludeFromSiteIndex: true,
  eleventyComputed: {
    title(data) {
      return data.post.title;
    },
    renderedBody(data) {
      return renderMarkdown(data.post.body.markdown);
    },
  },
  permalink(data) {
    return data.post.canonicalUrl;
  },
};
