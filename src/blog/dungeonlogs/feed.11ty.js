import { renderFeed } from "../../_lib/discovery-documents.js";
export default class { data() { return { permalink: "/blog/dungeonlogs/feed.xml", eleventyExcludeFromCollections: true }; } render({ collections, site }) { return renderFeed(collections.dungeonlogs, site, `${site.title} Dungeonlogs`, "Tabletop campaign recaps and session logs."); } }
