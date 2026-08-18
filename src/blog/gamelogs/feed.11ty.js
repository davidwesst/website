import { renderFeed } from "../../_lib/discovery-documents.js";
export default class { data() { return { permalink: "/blog/gamelogs/feed.xml", eleventyExcludeFromCollections: true }; } render({ collections, site }) { return renderFeed(collections.gamelogs, site, `${site.title} Gamelogs`, "Notes and reviews from games I have played."); } }
