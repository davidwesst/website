export function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ensureLeadingSlash(path) {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function ensureTrailingSlash(path) {
  return path.endsWith("/") ? path : `${path}/`;
}

export function normalizeUrlPath(path) {
  return ensureTrailingSlash(ensureLeadingSlash(path));
}
