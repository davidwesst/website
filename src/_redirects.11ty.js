export default class NetlifyRedirects {
  data() {
    return {
      permalink: "/_redirects",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    return data.redirects
      .map((redirect) => `${redirect.from} ${redirect.to} ${redirect.status}`)
      .join("\n");
  }
}
