export const CAMPAIGN_SOURCES = new Set(["youtube", "bluesky", "linkedin", "instagram"]);
export function campaignUrl(input, source, campaign, siteUrl = "https://david.wes.st") {
  if (!CAMPAIGN_SOURCES.has(source)) throw new Error(`Unsupported campaign source: ${source}`);
  if (!campaign?.trim()) throw new Error("Campaign is required");
  const url = new URL(input, siteUrl);
  if (url.origin !== new URL(siteUrl).origin || url.hash || url.pathname.startsWith("/categories/") || url.pathname.startsWith("/legacy/")) throw new Error("Only canonical published site URLs are supported");
  url.search = ""; url.searchParams.set("utm_source", source); url.searchParams.set("utm_medium", "social"); url.searchParams.set("utm_campaign", campaign.trim());
  return url.href;
}
