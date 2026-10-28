export function normalizeYoutube(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("A valid YouTube video URL is required."); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) throw new Error("Invalid YouTube video URL.");
  const segments = url.pathname.split("/").filter(Boolean);
  let id;
  if (url.hostname === "youtu.be" && segments.length === 1) id = segments[0];
  if (["youtube.com", "www.youtube.com", "m.youtube.com", "www.youtube-nocookie.com"].includes(url.hostname)) {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    if (["embed", "shorts"].includes(segments[0]) && segments.length === 2) id = segments[1];
  }
  if (!/^[A-Za-z0-9_-]{11}$/.test(id || "")) throw new Error("The YouTube URL must identify one video, not a playlist.");
  return { id, url: `https://www.youtube.com/watch?v=${id}`, embedUrl: `https://www.youtube.com/embed/${id}` };
}

export function normalizeVideoLinks(links = []) {
  if (!Array.isArray(links)) throw new Error("Video links must be a list.");
  return links.map((link) => {
    if (typeof link?.label !== "string" || !link.label.trim() || typeof link.url !== "string") throw new Error("Each video link needs a label and URL.");
    const value = link.url;
    if (/[\s\\\u0000-\u001f]/.test(value)) throw new Error("Invalid supplementary link URL.");
    const url = new URL(value, "https://website.invalid");
    if (!(value.startsWith("/") && !value.startsWith("//")) && !value.startsWith("https://")) throw new Error("Video links must use HTTPS or a root-relative path.");
    if (url.username || url.password) throw new Error("Video links cannot contain credentials.");
    return { label: link.label.trim(), url: value };
  });
}

export function prepareVideo(data) {
  return data.type === "video" ? { ...normalizeYoutube(data.youtube), links: normalizeVideoLinks(data.links) } : null;
}
