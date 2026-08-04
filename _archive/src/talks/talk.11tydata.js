import { renderMarkdown } from "../_lib/render-markdown.js";

export default {
  pagination: {
    data: "talks",
    size: 1,
    alias: "talk",
  },
  permalink(data) {
    return data.talk.canonicalUrl;
  },
  layout: "base.webc",
  eleventyExcludeFromSiteIndex: true,
  eleventyComputed: {
    title(data) {
      return data.talk.title;
    },
    renderedBody(data) {
      return renderMarkdown(data.talk.body.markdown);
    },
  },
};
