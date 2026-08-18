import { renderFeed } from "../../_lib/discovery-documents.js";
export default class { data() { return { permalink: "/blog/articles/feed.xml", eleventyExcludeFromCollections: true }; } render({ collections, site }) { return renderFeed(collections.articles, site, `${site.title} Articles`, "Essays, technical writing, and personal reflections."); } }
