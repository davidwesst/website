export const CAMPAIGN_SOURCES = new Set(["youtube", "bluesky", "linkedin", "instagram"]);
export function canonicalPageUrl(input, siteUrl = "https://david.wes.st") {
  const url = new URL(input, siteUrl);
  if (url.origin !== new URL(siteUrl).origin || url.search || url.hash || !url.pathname.endsWith("/") || /^\/(categories|legacy)(?:\/|$)/.test(url.pathname)) throw new Error("Only canonical published site page URLs are supported");
  return url;
}
export function campaignUrl(input, source, campaign, siteUrl = "https://david.wes.st") {
  if (!CAMPAIGN_SOURCES.has(source)) throw new Error(`Unsupported campaign source: ${source}`);
  if (!campaign?.trim()) throw new Error("Campaign is required");
  const url = canonicalPageUrl(input, siteUrl);
  url.searchParams.set("utm_source", source); url.searchParams.set("utm_medium", "social"); url.searchParams.set("utm_campaign", campaign.trim());
  return url.href;
}
