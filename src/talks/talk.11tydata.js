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
  eleventyComputed: {
    title(data) {
      return data.talk.title;
    },
  },
};
