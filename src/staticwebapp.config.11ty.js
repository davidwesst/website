import { hostingRoutes } from "../lib/hosting-routes.js";

// Retained during the migration observation period for Azure rollback builds.
export default class StaticWebAppConfig {
  data() { return { permalink: "/staticwebapp.config.json", eleventyExcludeFromCollections: true }; }
  render(data) {
    const routes = hostingRoutes(data.collections.all).filter(({ route, redirect }) =>
      !(redirect && route.endsWith("/index.html") && route.slice(0, -"index.html".length) === redirect));
    const output = JSON.stringify({ trailingSlash: "auto", routes }, null, 2);
    if (Buffer.byteLength(output) > 20 * 1024) throw new Error("staticwebapp.config.json exceeds Azure's 20 KB limit");
    return output;
  }
}
