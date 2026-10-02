import { CONFIRMED_REDIRECT_REPAIRS } from "./legacy-route-repairs.js";

const repairs = new Map(CONFIRMED_REDIRECT_REPAIRS);
export const EMBED_REPAIRS = new Map([
  ["//www.youtube.com/embed/M5OQchl9bQA", "https://www.youtube.com/embed/M5OQchl9bQA"],
  ["//www.youtube.com/embed/-nbC9Pvykv8", "https://www.youtube.com/embed/-nbC9Pvykv8"],
  ["//www.youtube.com/embed/pAfPqxzyBIc", "https://www.youtube.com/embed/pAfPqxzyBIc"],
]);

// Conservative path-pattern inference, never a claim about the visitor.
const PROBES = [
  [/\.php(?:[^a-z]|$)/i, "PHP endpoint on a static site"],
  [/(?:^|\/)(?:wordpress|wp)(?:\/|$)|(?:^|\/)wp[-.]/i, "WordPress endpoint"],
  [/(?:^|\/)\.env(?:[^a-z]|$)/i, "Environment-file probe"],
  [/(?:^|\/)(?:\.git(?:[/.]|$)|\.aws(?:\/|$)|\.ssh(?:\/|$)|\.docker(?:\/|$)|\.npmrc$|\.dockerenv$)/i, "Private configuration probe"],
  [/\/var\/run\/secrets\/|\/id_rsa$|\/privatekey\.key$|\/debug\/pprof\//i, "Credential or runtime probe"],
  [/(?:fckeditor|ckeditor)\/editor\/filemanager\//i, "Editor file-manager probe"],
];

export function classifyRoute(path, { published = new Set(), references = new Map(), redirects = new Map() } = {}) {
  if (path === "/favicon.ico") return { classification: "excluded-favicon-56", evidence: "Owned by issue #56", target: "/favicon.ico" };
  if (repairs.has(path)) return { classification: "confirmed-legacy-route", evidence: path.endsWith("feed.xml") ? "Historical feed permalink at 9447db9^" : "Authored links/redirectFrom and canonical content inventory", target: repairs.get(path) };
  if (EMBED_REPAIRS.has(path)) return { classification: "confirmed-generated-embed", evidence: "Authored iframe prepended the former website host to a YouTube URL", target: EMBED_REPAIRS.get(path) };
  if (redirects.has(path)) return { classification: "currently-redirected", evidence: "Already covered by the generated permanent route model; no additional repair", target: redirects.get(path) };
  if (published.has(path)) return { classification: "currently-published", evidence: "Exists in the checked artifact; historical 404 does not establish a current defect", target: path };
  if (path === "/migration-missing-page-93a10/") return { classification: "expected-404", evidence: "Negative route in tools/check-hosting.mjs", target: null };
  const probe = PROBES.find(([pattern]) => pattern.test(path));
  if (probe) return { classification: "scanner-like", evidence: `${probe[1]}; inferred from path only`, target: null };
  const referring = references.get(path) || [];
  return { classification: "unresolved", evidence: referring.length ? "Generated reference requires investigation" : "No generated reference or confirmed legacy mapping; preserve 404", target: null };
}

export function triageRoutes(rows, inventory, subsequent, subsequentScope) {
  const later = new Map((subsequent || []).map(({ path, count }) => [path, count]));
  return rows.map(({ path, count }) => ({
    path, count, ...classifyRoute(path, inventory),
    generatedReferrers: inventory.references.get(path) || [],
    subsequentCount: subsequent && (!subsequentScope || subsequentScope.has(path)) ? later.get(path) ?? 0 : null,
  })).sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));
}

export function triageCsv(rows) {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const fields = ["path", "count", "classification", "evidence", "target", "generatedReferrers", "subsequentCount"];
  return `${fields.join(",")}\n${rows.map((row) => fields.map((field) => quote(Array.isArray(row[field]) ? row[field].join("; ") : row[field])).join(",")).join("\n")}\n`;
}
