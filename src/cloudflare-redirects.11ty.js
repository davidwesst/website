import { hostingRoutes, cloudflareRedirects } from "../lib/hosting-routes.js";

export default class CloudflareRedirects {
  data() { return { permalink: "/_redirects", eleventyExcludeFromCollections: true }; }
  render(data) { return cloudflareRedirects(hostingRoutes(data.collections.all)); }
}
