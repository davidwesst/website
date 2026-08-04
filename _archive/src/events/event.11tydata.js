export default {
  pagination: {
    data: "events",
    size: 1,
    alias: "event",
  },
  permalink(data) {
    return data.event.canonicalUrl;
  },
  layout: "base.webc",
  eleventyExcludeFromSiteIndex: true,
  eleventyComputed: {
    title(data) {
      return data.event.title;
    },
  },
};
