import sharp from "sharp";
import { normalizeYoutube } from "./video.js";

async function responseFor(url, fetch, timeoutMs) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), redirect: "error" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

export async function fetchYoutubeMetadata(youtube, { apiKey = process.env.YOUTUBE_API_KEY, fetch = globalThis.fetch, timeoutMs = 10000 } = {}) {
  if (!apiKey) throw new Error("Set YOUTUBE_API_KEY to use --fetch-youtube.");
  const { id } = normalizeYoutube(youtube);
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.search = new URLSearchParams({ part: "snippet", id, key: apiKey }).toString();
  let snippet;
  try {
    const response = await responseFor(url, fetch, timeoutMs);
    const data = await response.json();
    snippet = data.items?.find((item) => item.id === id)?.snippet;
    if (!snippet?.title?.trim() || !snippet.publishedAt || Number.isNaN(Date.parse(snippet.publishedAt))) throw new Error("Unavailable video");
  } catch {
    // Fetch errors may include the credential-bearing request URL.
    throw new Error("YouTube metadata lookup failed or the video is unavailable. Check the API key and video URL, or create the post offline.");
  }
  return {
    title: snippet.title.trim(),
    date: new Date(snippet.publishedAt),
    summary: String(snippet.description || "").trim().split(/\r?\n\s*\r?\n/)[0].replace(/\s+/g, " "),
    thumbnailUrl: ["maxres", "standard", "high", "medium", "default"].map((size) => snippet.thumbnails?.[size]?.url).find(Boolean),
  };
}

export async function fetchYoutubeThumbnail(value, { fetch = globalThis.fetch, timeoutMs = 10000 } = {}) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !["i.ytimg.com", "img.youtube.com"].includes(url.hostname) || url.username || url.password || url.port) throw new Error("Invalid YouTube thumbnail URL.");
  const response = await responseFor(url, fetch, timeoutMs);
  const limit = 10 * 1024 * 1024;
  if (Number(response.headers.get("content-length")) > limit) throw new Error("Thumbnail is too large.");
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error("Thumbnail is too large.");
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  const image = sharp(bytes, { limitInputPixels: 20000000 });
  const metadata = await image.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format)) throw new Error("Unsupported thumbnail format.");
  await image.clone().stats(); // Decode the image, not just its header.
  return { bytes, filename: `thumbnail.${metadata.format === "jpeg" ? "jpg" : metadata.format}` };
}
