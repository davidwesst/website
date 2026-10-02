export const SITE_HOSTNAMES = new Set(["david.wes.st", "davidwesst.com", "www.davidwesst.com"]);

// Absolute links to previous website hosts still refer to our own content.
export function siteLinkUrl(reference, pageUrl, origin = "https://david.wes.st") {
  const url = new URL(reference, new URL(pageUrl, origin));
  return ["http:", "https:"].includes(url.protocol) && SITE_HOSTNAMES.has(url.hostname) ? url : undefined;
}
