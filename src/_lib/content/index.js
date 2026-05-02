import { loadEvents, loadPosts, loadTalks } from "./loaders/local-content.js";
import { normalizeContent } from "./normalize-content.js";

let cachedContent;

export function getContent() {
  if (!cachedContent) {
    cachedContent = normalizeContent({ talks: loadTalks(), events: loadEvents(), posts: loadPosts() });
  }

  return cachedContent;
}

export function getDocuments() {
  return getContent().documents;
}

export function getPostDocuments() {
  return getDocuments().filter((document) => ["blog", "gamelog", "dungeonlog"].includes(document.series));
}

export function getEvents() {
  return getContent().events;
}

export function getRedirects() {
  return getContent().redirects;
}
