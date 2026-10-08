import { renderRobots } from "../lib/crawler-policy.js";
export default class {
  data() { return { permalink: "/robots.txt", eleventyExcludeFromCollections: true }; }
  render({ site }) { return renderRobots(site.url); }
}
