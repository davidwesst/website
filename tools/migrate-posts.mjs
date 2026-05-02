import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const DEST_ROOT = path.join(ROOT, "src/content/posts");
const BLOG_SOURCE = path.join(ROOT, "sources/davidwesst.github.io/content/blog");
const DW_GAMELOG_SOURCE = path.join(ROOT, "sources/davidwesst.github.io/content/gamelog");
const DZ_GAMELOG_SOURCE = path.join(ROOT, "sources/digital-zuihitsu/src/blog/gamelog");
const DZ_DUNGEONLOG_SOURCE = path.join(ROOT, "sources/digital-zuihitsu/src/blog/dungeonlog");

function readEntry(directory) {
  const nativePath = path.join(directory, "index.md");
  const parsed = matter(fs.readFileSync(nativePath, "utf8"));

  return {
    slug: path.basename(directory),
    nativePath,
    body: parsed.content.trim(),
    data: parsed.data,
  };
}

function listEntries(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name))
    .filter((directory) => fs.existsSync(path.join(directory, "index.md")))
    .map(readEntry);
}

function copyAssets(fromDirectory, toDirectory) {
  fs.mkdirSync(toDirectory, { recursive: true });

  for (const entry of fs.readdirSync(fromDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name === "index.md") {
      continue;
    }

    fs.copyFileSync(path.join(fromDirectory, entry.name), path.join(toDirectory, entry.name));
  }
}

function normalizeDate(value) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.valueOf())) {
    return parsed.toISOString().slice(0, 10);
  }

  return String(value);
}

function normalizeMedia(data = {}) {
  const image = data.media?.image || data.featured_image || data.title_image;

  if (!image) {
    return undefined;
  }

  return {
    image: path.basename(image),
    imageAlt: data.media?.imageAlt || data.featured_image_alt || data.title_image_alt || "",
    mediaType: data.media?.mediaType || data.image_type || data["image-type"],
    credit: data.media?.credit || data.image_credit || data["image-credit"],
  };
}

function normalizeTaxonomy(data = {}) {
  return {
    tags: Array.isArray(data.tags) ? data.tags : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
  };
}

function normalizeReview(data = {}) {
  const review = {};

  if (data.game_ids) {
    review.subjectIds = data.game_ids;
  }

  if (data.play_data) {
    review.play = {
      startedOn: normalizeDate(data.play_data.started_on),
      completedOn: normalizeDate(data.play_data.completed_on),
      platform: data.play_data.platform,
    };
  }

  if (data.rating) {
    review.rating = data.rating;
  }

  return Object.keys(review).length ? review : undefined;
}

function removeUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(removeUndefined).filter((item) => item !== undefined);
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, removeUndefined(item)])
        .filter(([, item]) => item !== undefined),
    );
  }

  return value === undefined ? undefined : value;
}

function writeCanonicalEntry({ entry, series, docType, source, canonicalUrl, legacyUrls = [], extraData = {} }) {
  const destination = path.join(DEST_ROOT, series, entry.slug);
  const data = {
    id: `${series}/${entry.slug}`,
    source,
    docType,
    series,
    slug: entry.slug,
    title: entry.data.title,
    summary: entry.data.summary || entry.data.description,
    dates: {
      published: normalizeDate(entry.data.date),
      updated: normalizeDate(entry.data.updated),
      sort: normalizeDate(entry.data.date || entry.data.updated),
    },
    taxonomy: normalizeTaxonomy(entry.data),
    media: normalizeMedia(entry.data),
    canonicalUrl,
    legacyUrls,
    meta: {
      sourceMeta: entry.data,
    },
    ...extraData,
  };

  const cleanData = removeUndefined(data);

  fs.mkdirSync(destination, { recursive: true });
  copyAssets(path.dirname(entry.nativePath), destination);
  fs.writeFileSync(path.join(destination, "index.md"), matter.stringify(entry.body, cleanData));
}

function migrateBlog() {
  for (const entry of listEntries(BLOG_SOURCE)) {
    writeCanonicalEntry({
      entry,
      series: "blog",
      docType: "post",
      source: "davidwesst.github.io",
      canonicalUrl: `/blog/${entry.slug}/`,
      legacyUrls: [`/blog/${entry.slug}/index.html`],
    });
  }
}

function migrateGamelog() {
  const davidWesstSlugs = new Set(listEntries(DW_GAMELOG_SOURCE).map((entry) => entry.slug));

  for (const entry of listEntries(DZ_GAMELOG_SOURCE)) {
    const legacyUrls = [`/blog/gamelog/entry.html?slug=${entry.slug}`];

    if (davidWesstSlugs.has(entry.slug)) {
      legacyUrls.push(`/gamelog/${entry.slug}/`, `/gamelog/${entry.slug}/index.html`);
    }

    writeCanonicalEntry({
      entry,
      series: "gamelog",
      docType: "review",
      source: "digital-zuihitsu",
      canonicalUrl: `/blog/gamelog/${entry.slug}/`,
      legacyUrls,
      extraData: {
        review: normalizeReview(entry.data),
      },
    });
  }
}

function migrateDungeonlog() {
  for (const entry of listEntries(DZ_DUNGEONLOG_SOURCE)) {
    writeCanonicalEntry({
      entry,
      series: "dungeonlog",
      docType: "session",
      source: "digital-zuihitsu",
      canonicalUrl: `/blog/dungeonlog/${entry.slug}/`,
      legacyUrls: [],
      extraData: {
        meta: {
          sourceMeta: {
            ...entry.data,
            aggregateUrl: "/blog/dungeonlog.html",
            aggregateAnchor: entry.slug,
          },
        },
      },
    });
  }
}

migrateBlog();
migrateGamelog();
migrateDungeonlog();

console.log("Migrated posts into src/content/posts.");
