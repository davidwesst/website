import { renderFeed } from "./_lib/discovery-documents.js";
export default class { data() { return { permalink: "/feed.xml", eleventyExcludeFromCollections: true }; } render({ collections, site }) { return renderFeed(collections.posts, site, `${site.title} Blog`, "Articles, gamelogs, and dungeonlogs."); } }
