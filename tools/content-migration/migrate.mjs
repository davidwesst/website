import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARCHIVE_CONTENT = path.join(ROOT, "_archive", "src", "content");
const TARGET_CONTENT = path.join(ROOT, "src", "content");
const MANIFEST_PATH = path.join(ROOT, "src", "_data", "migration-manifest.json");
const EXCEPTIONS_PATH = path.join(ROOT, "src", "_data", "asset-exceptions.json");
const TALK_PUBLISH_DATE = "2026-08-05";
const IMAGE_EXTENSIONS = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const RESERVED_CATEGORIES = new Set(["article", "articles", "blog", "dungeonlog", "dungeonlogs", "gamelog", "gamelogs", "post", "posts", "talk", "talks"]);
const LINK_REWRITES = new Map([
  ["](/blog/Highlight-Reel-for-2014/)", "](/blog/highlight-reel-for-2014/)"],
  ["](/blog/Intital-Thoughts-on-Using-Phaser/)", "](/blog/new-post-initial-thoughts-on-phaser/)"],
  ["](/blog/How-to-Compile-Typescript-into-a-Single-File-with-AMD-Modules/)", "](/blog/typescript-with-amd-and-gulp/)"],
  ["](/blog/Custom-Tasks-for-Java-in-Visual-Studio-Code/)", "](/blog/custom-tasks-for-java-in-visual-studio-code/)"],
  ["](200~https://github.com/microsoft/vscode-js-debug/issues/374)", "](https://github.com/microsoft/vscode-js-debug/issues/374)"],
  ["](nodejs.org/)", "](https://nodejs.org/)"],
  ["](\"https://unsplash.com/", "](https://unsplash.com/"],
  ["creditCopyText\")", "creditCopyText)"],
]);
const BANNER_ALT_OVERRIDES = new Map([
  ["talks/from-custom-cots-to-cloud", "Title slide for From Custom COTS to Cloud over an abstract blue backdrop."],
  ["talks/going-beyond-powerpoint", "Cave-painting scene of a presenter showing diagrams to a seated audience."],
  ["talks/hack-the-it-governance-matrix", "Title slide beside white spheres connected by winding magenta lines."],
  ["talks/integrations-orchestrations-automations", "Neon servers and computers connected by bright multicolored data lines."],
  ["talks/is-ai-ready-to-take-over-the-world", "Robotic hands cradle Earth beside the talk title on a white panel."],
  ["talks/its-scary-using-new-ai-technology", "Two speakers sit onstage before a projected ghostly AI image."],
  ["talks/no-mission-impossible", "Purple Ellucian Live 2024 title slide with the talk title and speakers."],
  ["dungeonlogs/2025-08-04", "Six fantasy adventurers pose in a dark jungle above the Heart of Ubtao title."],
  ["dungeonlogs/2025-08-18", "A donkey detective falls below apes and undead figures in a noir poster."],
  ["dungeonlogs/2025-09-01", "A dragonborn detective and adventurers pose before a burning tower and bats."],
  ["dungeonlogs/2025-10-18", "A dragonborn detective and adventurers pose amid lightning and orange smoke."],
  ["dungeonlogs/2025-12-01", "A dragonborn warrior raises a lightning axe amid snakes and allies."],
  ["dungeonlogs/2025-12-15", "Adventurers battle a skeleton horde with fire, lightning, and a glowing axe."],
  ["dungeonlogs/2025-12-27", "Four adventurers tumble through a rocky canyon beneath storm clouds."],
  ["dungeonlogs/2026-01-05", "Adventurers gather around a screaming figure in a monochrome horror poster."],
  ["dungeonlogs/2026-01-25", "Noir adventurers face carnivorous plants and undead in a ruined garden."],
  ["dungeonlogs/2026-02-08", "A noir collage shows adventurers, spiders, statues, a queen, and a boat."],
]);

function slash(value) {
  return value.replaceAll("\\", "/");
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function clean(value) {
  if (Array.isArray(value)) {
    const items = value.map(clean).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, clean(item)])
      .filter(([, item]) => item !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value === undefined || value === null || value === "" ? undefined : value;
}

function isoDate(value) {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? String(value) : parsed.toISOString().slice(0, 10);
}

function inferLinkType(label = "") {
  const value = label.toLowerCase();
  if (value.includes("slide")) return "slides";
  if (value.includes("record") || value.includes("video")) return "recording";
  if (value.includes("github") || value.includes("source")) return "source";
  if (value.includes("demo")) return "demo";
  return "event";
}

function normalizeCategory(value) {
  const normalized = String(value).trim().toLowerCase().replaceAll(" ", "-").replace(/-+/g, "-");
  return normalized === "web-development" ? "web-development" : normalized;
}

function categoriesFor(data, eventIds) {
  return [...(data.taxonomy?.tags || []), ...(data.taxonomy?.categories || [])]
    .map(normalizeCategory)
    .filter((value) => value && !RESERVED_CATEGORIES.has(value) && !eventIds.has(value))
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort((left, right) => left.localeCompare(right));
}

function listDirectories(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name));
}

function readMarkdown(directory) {
  const file = path.join(directory, "index.md");
  const parsed = matter(readFileSync(file, "utf8"));
  return { directory, file, slug: path.basename(directory), data: parsed.data, body: parsed.content.trim() };
}

function assetReference(fileName) {
  return `./${fileName}`;
}

function resolveAsset(directory, reference) {
  const raw = String(reference).replace(/^\.\//, "").split(/[?#]/, 1)[0];
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Keep malformed historical paths available for exception reporting.
  }
  const direct = path.resolve(directory, decoded);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  const basename = path.join(directory, path.basename(decoded));
  return existsSync(basename) && statSync(basename).isFile() ? basename : undefined;
}

function missingNote(reference, alt = "") {
  const description = alt.trim() || path.basename(String(reference).split(/[?#]/, 1)[0]) || "image";
  return `*Archived image unavailable: ${description}.*`;
}

function fallbackImageAlt(reference, title) {
  let filename = path.basename(String(reference).split(/[?#]/, 1)[0]);
  try { filename = decodeURIComponent(filename); } catch {}
  const description = filename
    .replace(/\.[^.]+$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return description && !/^[a-z0-9]{6,}$/i.test(description.replace(/\s/g, ""))
    ? `${description}.`
    : `Illustration for “${title}”.`;
}

function normalizeBodyHeadings(body) {
  let inFence = false;
  return body
    .split(/(\r?\n)/)
    .map((part) => {
      if (/^\r?\n$/.test(part)) return part;
      const line = part;
      if (/^\s*(?:```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      return inFence ? line : line.replace(/^# /, "## ");
    })
    .join("");
}

function rewriteBodyImages(entry, type, exceptions) {
  const definitions = new Map();
  let body = entry.body.replace(/\s*\[oai_citation:[^\]]+\]\(sediment:[^)]+\)/g, "");

  body = body.replace(/<!--\s*MISSING_IMG\s+(.+?)\s*-->/g, (_match, reference) => {
    exceptions.push({ document: `${type}/${entry.slug}`, reference: reference.trim(), reason: "missing-in-archive" });
    return missingNote(reference);
  });

  body.replace(/^\[([^\]]+)\]:\s*(\S+)/gm, (_match, id, reference) => definitions.set(id.toLowerCase(), reference));

  body = body.replace(/!\[([^\]]*)\]\[([^\]]+)\]/g, (match, alt, id) => {
    const reference = definitions.get(id.toLowerCase());
    if (!reference) return match;
    const normalizedAlt = alt.trim() || fallbackImageAlt(reference, entry.data.title);
    if (/^(?:https?:)?\/\//.test(reference)) return `![${normalizedAlt}][${id}]`;
    const source = resolveAsset(entry.directory, reference);
    if (!source || !IMAGE_EXTENSIONS.has(path.extname(source).toLowerCase())) {
      exceptions.push({ document: `${type}/${entry.slug}`, reference, reason: "missing-in-archive" });
      return missingNote(reference, alt);
    }
    return `![${normalizedAlt}](${assetReference(path.basename(source))})`;
  });

  body = body.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+[^)]*)?\)/g, (match, alt, reference) => {
    const normalizedAlt = alt.trim() || fallbackImageAlt(reference, entry.data.title);
    if (/^(?:https?:)?\/\//.test(reference) || reference.startsWith("data:")) {
      return alt.trim() ? match : match.replace("![](", `![${normalizedAlt}](`);
    }
    const source = resolveAsset(entry.directory, reference);
    if (!source || !IMAGE_EXTENSIONS.has(path.extname(source).toLowerCase())) {
      exceptions.push({ document: `${type}/${entry.slug}`, reference, reason: "missing-in-archive" });
      return missingNote(reference, alt);
    }
    return `![${normalizedAlt}](${assetReference(path.basename(source))})`;
  });

  body = body.replace(/<img\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)>/gi, (match, before, reference, after) => {
    if (/^(?:https?:)?\/\//.test(reference) || reference.startsWith("data:")) return match;
    const source = resolveAsset(entry.directory, reference);
    if (!source || !IMAGE_EXTENSIONS.has(path.extname(source).toLowerCase())) {
      exceptions.push({ document: `${type}/${entry.slug}`, reference, reason: "missing-in-archive" });
      return missingNote(reference);
    }
    return `<img${before}src="${assetReference(path.basename(source))}"${after}>`;
  });

  body = body.replace(/^\[([^\]]+)\]:\s*(\S+)/gm, (match, id, reference) => {
    if (!definitions.has(id.toLowerCase()) || /^(?:https?:)?\/\//.test(reference)) return match;
    const source = resolveAsset(entry.directory, reference);
    return source ? `[${id}]: ${assetReference(path.basename(source))}` : "";
  });
  for (const [legacy, canonical] of LINK_REWRITES) body = body.replaceAll(legacy, canonical);
  return normalizeBodyHeadings(body);
}

function makeBanner(entry, type, exceptions) {
  const image = entry.data.media?.image;
  if (!image) return undefined;
  const source = resolveAsset(entry.directory, image);
  if (!source) {
    exceptions.push({ document: `${type}/${entry.slug}`, reference: image, reason: "missing-banner-in-archive" });
    return undefined;
  }
  const oldAlt = String(entry.data.media?.imageAlt || "").trim();
  const alt = BANNER_ALT_OVERRIDES.get(`${type}/${entry.slug}`) || (oldAlt && oldAlt.toLowerCase() !== "alt text goes here."
    ? oldAlt
    : `Banner artwork for “${entry.data.title}”.`);
  return clean({
    src: assetReference(path.basename(source)),
    alt,
    credit: typeof entry.data.media?.credit === "string" ? entry.data.media.credit : undefined,
  });
}

function baseData(entry, type, eventIds, exceptions, { includeDate = true } = {}) {
  const categories = categoriesFor(entry.data, eventIds);
  return clean({
    title: entry.data.title,
    date: includeDate ? isoDate(entry.data.dates?.published || entry.data.date) : undefined,
    updated: isoDate(entry.data.dates?.updated || entry.data.updated),
    summary: entry.data.summary,
    categories,
    redirectFrom: entry.data.legacyUrls,
    banner: makeBanner(entry, type, exceptions),
  }) || {};
}

function gamelogData(review = {}) {
  const ids = review.subjectIds || {};
  return clean({
    game: { ids: { igdb: ids.igdb ?? ids.igdb_id } },
    playthrough: {
      started: isoDate(review.play?.startedOn),
      completed: isoDate(review.play?.completedOn),
      platform: review.play?.platform,
    },
    ratings: review.rating,
  });
}

function talkData(entry, events) {
  const speakers = ["David Wesst", ...(entry.data.coAuthors || [])].filter((value, index, values) => values.indexOf(value) === index);
  const appearances = (entry.data.eventRefs || []).map((reference) => {
    const event = events.get(reference.eventId);
    if (!event) throw new Error(`Missing event ${reference.eventId} for talk ${entry.slug}`);
    const coPresenters = reference.meta?.coPresenters || [];
    return clean({
      event: event.title,
      start: isoDate(event.dates?.start),
      end: isoDate(event.dates?.end),
      location: event.location,
      speakers: coPresenters.length ? ["David Wesst", ...coPresenters] : undefined,
      links: (reference.links || []).map((link) => ({ label: link.label, url: link.url, type: inferLinkType(link.label) })),
    });
  });
  return clean({ speakers, appearances });
}

function collectAssets(entry, targetPath, stageContent, manifestAssets) {
  const destination = path.join(stageContent, targetPath);
  mkdirSync(destination, { recursive: true });
  for (const item of readdirSync(entry.directory, { withFileTypes: true })) {
    if (!item.isFile() || !IMAGE_EXTENSIONS.has(path.extname(item.name).toLowerCase())) continue;
    const source = path.join(entry.directory, item.name);
    const target = path.join(destination, item.name);
    cpSync(source, target);
    manifestAssets.push({
      source: slash(path.relative(ROOT, source)),
      destination: slash(path.relative(ROOT, path.join(TARGET_CONTENT, targetPath, item.name))),
      sha256: sha256(source),
    });
  }
}

function writeEntry(stageContent, targetPath, data, body) {
  const destination = path.join(stageContent, targetPath, "index.md");
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, matter.stringify(`${body.trim()}\n`, data), "utf8");
}

function createMigration(stageRoot) {
  const stageContent = path.join(stageRoot, "content");
  const exceptions = [];
  const manifestAssets = [];
  const counts = { articles: 0, gamelogs: 0, dungeonlogs: 0, talks: 0, pages: 0, appearances: 0 };
  const events = new Map(
    listDirectories(path.join(ARCHIVE_CONTENT, "events")).map((directory) => {
      const value = JSON.parse(readFileSync(path.join(directory, "index.json"), "utf8"));
      return [value.id, value];
    }),
  );
  const eventIds = new Set(events.keys());

  for (const [archiveType, targetType] of [["blog", "articles"], ["gamelog", "gamelogs"], ["dungeonlog", "dungeonlogs"]]) {
    for (const directory of listDirectories(path.join(ARCHIVE_CONTENT, "posts", archiveType))) {
      const entry = readMarkdown(directory);
      const data = baseData(entry, targetType, eventIds, exceptions);
      if (targetType === "gamelogs") data.customData = gamelogData(entry.data.review);
      const body = rewriteBodyImages(entry, targetType, exceptions);
      const targetPath = path.join("posts", targetType, entry.slug);
      writeEntry(stageContent, targetPath, data, body);
      collectAssets(entry, targetPath, stageContent, manifestAssets);
      counts[targetType]++;
    }
  }

  for (const directory of listDirectories(path.join(ARCHIVE_CONTENT, "talks"))) {
    const entry = readMarkdown(directory);
    const data = baseData(entry, "talks", eventIds, exceptions);
    data.date = TALK_PUBLISH_DATE;
    data.customData = talkData(entry, events);
    counts.appearances += data.customData.appearances?.length || 0;
    const body = rewriteBodyImages(entry, "talks", exceptions);
    const targetPath = path.join("talks", entry.slug);
    writeEntry(stageContent, targetPath, data, body);
    collectAssets(entry, targetPath, stageContent, manifestAssets);
    counts.talks++;
  }

  for (const directory of listDirectories(path.join(ARCHIVE_CONTENT, "pages"))) {
    const entry = readMarkdown(directory);
    const data = baseData(entry, "pages", eventIds, exceptions, { includeDate: false });
    const body = rewriteBodyImages(entry, "pages", exceptions);
    const targetPath = path.join("pages", entry.slug);
    writeEntry(stageContent, targetPath, data, body);
    collectAssets(entry, targetPath, stageContent, manifestAssets);
    counts.pages++;
  }

  const uniqueExceptions = [...new Map(exceptions.map((item) => [`${item.document}\0${item.reference}`, item])).values()]
    .sort((left, right) => `${left.document}/${left.reference}`.localeCompare(`${right.document}/${right.reference}`));
  const manifest = {
    generatedOn: TALK_PUBLISH_DATE,
    counts,
    assets: manifestAssets.sort((left, right) => left.destination.localeCompare(right.destination)),
  };
  return { stageContent, exceptions: uniqueExceptions, manifest };
}

function compareTree(expected, actual, label) {
  const list = (root) => existsSync(root)
    ? readdirSync(root, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => slash(path.relative(root, entry.parentPath ? path.join(entry.parentPath, entry.name) : path.join(entry.path, entry.name)))).sort()
    : [];
  const expectedFiles = list(expected);
  const actualFiles = list(actual).filter((file) => label !== "Content" || file.endsWith("index.md") || IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()));
  if (JSON.stringify(expectedFiles) !== JSON.stringify(actualFiles)) throw new Error(`${label} file list differs from migration output`);
  for (const file of expectedFiles) {
    const expectedPath = path.join(expected, file);
    const actualPath = path.join(actual, file);
    const expectedText = label === "Content" ? readFileSync(expectedPath, "utf8").replace(/\r\n/g, "\n") : undefined;
    const actualText = label === "Content" ? readFileSync(actualPath, "utf8").replace(/\r\n/g, "\n") : undefined;
    const differs = label === "Content" ? expectedText !== actualText : sha256(expectedPath) !== sha256(actualPath);
    if (differs) {
      if (label !== "Content") throw new Error(`${label} differs: ${file}`);
      const line = expectedText.split(/\r?\n/).findIndex((value, index) => value !== actualText.split(/\r?\n/)[index]) + 1;
      const detail = line ? `; expected ${JSON.stringify(expectedText.split(/\r?\n/)[line - 1])}, received ${JSON.stringify(actualText.split(/\r?\n/)[line - 1])}` : "";
      throw new Error(`${label} differs: ${file}${line ? ` (first difference at line ${line})` : ""}${detail}`);
    }
  }
}

const mode = process.argv[2];
if (!new Set(["--write", "--check"]).has(mode)) throw new Error("Use --write or --check");
const stageRoot = mkdtempSync(path.join(tmpdir(), "website-content-migration-"));

try {
  const result = createMigration(stageRoot);
  const expectedManifest = `${JSON.stringify(result.manifest, null, 2)}\n`;
  const expectedExceptions = `${JSON.stringify(result.exceptions, null, 2)}\n`;

  if (mode === "--write") {
    if (existsSync(TARGET_CONTENT)) {
      throw new Error("Migration target already exists; use content:migrate:check to compare it");
    }
    mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
    cpSync(result.stageContent, TARGET_CONTENT, { recursive: true });
    writeFileSync(MANIFEST_PATH, expectedManifest, "utf8");
    writeFileSync(EXCEPTIONS_PATH, expectedExceptions, "utf8");
    console.log(`Migrated ${Object.values(result.manifest.counts).slice(0, 5).reduce((sum, value) => sum + value, 0)} documents and ${result.manifest.assets.length} assets.`);
  } else {
    compareTree(result.stageContent, TARGET_CONTENT, "Content");
    if (!existsSync(MANIFEST_PATH) || readFileSync(MANIFEST_PATH, "utf8") !== expectedManifest) throw new Error("Migration manifest differs");
    if (!existsSync(EXCEPTIONS_PATH) || readFileSync(EXCEPTIONS_PATH, "utf8") !== expectedExceptions) throw new Error("Asset exception manifest differs");
    console.log("Migrated content, assets, and manifests match the archive transformation.");
  }
} finally {
  rmSync(stageRoot, { recursive: true, force: true });
}
