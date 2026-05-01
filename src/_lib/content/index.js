import { loadEvents, loadTalks } from "./loaders/local-content.js";
import { normalizeContent } from "./normalize-talks.js";

let cachedContent;

export function getContent() {
  if (!cachedContent) {
    cachedContent = normalizeContent({ talks: loadTalks(), events: loadEvents() });
  }

  return cachedContent;
}

export function getDocuments() {
  return getContent().documents;
}

export function getEvents() {
  return getContent().events;
}

export function getRedirects() {
  return getContent().redirects;
}
