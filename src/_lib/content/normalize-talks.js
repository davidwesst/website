import { normalizeContent } from "./normalize-content.js";

export { normalizeContent, validateRedirects } from "./normalize-content.js";

export function normalizeTalks(rawTalks, rawEvents = []) {
  return normalizeContent({ talks: rawTalks, events: rawEvents });
}
