import { renderFeed } from "../_lib/discovery-documents.js";
export default class { data() { return { permalink: "/talks/feed.xml", eleventyExcludeFromCollections: true }; } render({ collections, site }) { return renderFeed(collections.talks, site, `${site.title} Talks`, "Presentations and appearances.", "/talks/feed.xml"); } }
