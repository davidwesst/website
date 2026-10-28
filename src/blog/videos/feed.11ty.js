import { renderFeed } from "../../_lib/discovery-documents.js";
export default class { data() { return { permalink: "/blog/videos/feed.xml", eleventyExcludeFromCollections: true }; } render({ collections, site }) { return renderFeed(collections.videos, site, `${site.title} Videos`, "Video devlogs and software ideas.", "/blog/videos/feed.xml"); } }
