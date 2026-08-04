import path from "node:path";
import { normalizeUrlPath } from "./slug.js";

const SOURCE = "website";
const POST_SERIES = new Set(["blog", "gamelog", "dungeonlog"]);

function normalizeLegacyUrl(value) {
  const url = String(value);

  if (url.includes("?") || path.extname(url)) {
    return url.startsWith("/") ? url : `/${url}`;
  }

  return normalizeUrlPath(url);
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

function normalizeLinks(links = []) {
  return links
    .filter((link) => link && link.url)
    .map((link) => ({
      label: link.label || link.description || link.title || "Link",
      url: link.url,
    }));
}

function normalizeMedia(raw = {}, canonicalUrl) {
  const image = raw.image || raw.featured_image || raw.title_image;

  if (!image) {
    return undefined;
  }

  const fileName = path.basename(image);

  return {
    image: `${canonicalUrl}${fileName}`,
    imageAlt: raw.imageAlt || raw.featured_image_alt || raw.title_image_alt,
    mediaType: raw.mediaType || raw.image_type || raw["image-type"],
    credit: raw.credit || raw.image_credit || raw["image-credit"],
  };
}

function normalizeTaxonomy(raw = {}) {
  return {
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    categories: Array.isArray(raw.categories) ? raw.categories : [],
  };
}

function normalizeDates(raw = {}) {
  return {
    published: normalizeDate(raw.published || raw.date),
    updated: normalizeDate(raw.updated),
    sort: normalizeDate(raw.sort || raw.published || raw.date || raw.updated),
  };
}

function normalizeReview(raw = {}) {
  const review = raw.review || {};
  const play = review.play || raw.play_data;

  if (!review.subjectIds && !raw.game_ids && !play && !review.rating && !raw.rating) {
    return undefined;
  }

  return {
    subjectIds: review.subjectIds || raw.game_ids,
    play: play
      ? {
          startedOn: normalizeDate(play.startedOn || play.started_on),
          completedOn: normalizeDate(play.completedOn || play.completed_on),
          platform: play.platform,
        }
      : undefined,
    rating: review.rating || raw.rating,
  };
}

function removeUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(removeUndefined).filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, removeUndefined(item)])
        .filter(([, item]) => item !== undefined),
    );
  }

  return value === undefined ? undefined : value;
}

function normalizeTalk(raw) {
  const slug = raw.data.slug || raw.slug;
  const id = raw.data.id || slug;
  const canonicalUrl = normalizeUrlPath(raw.data.canonicalUrl || `/talks/${slug}/`);
  const legacyUrls = (raw.data.legacyUrls || [])
    .map(normalizeLegacyUrl)
    .filter((legacyUrl) => legacyUrl !== canonicalUrl);

  return removeUndefined({
    id,
    source: SOURCE,
    docType: raw.data.docType || "talk",
    series: raw.data.series || "talks",
    slug,
    title: raw.data.title,
    summary: raw.data.summary,
    body: {
      markdown: raw.body,
    },
    dates: {},
    taxonomy: raw.data.taxonomy || { tags: [], categories: [] },
    media: normalizeMedia(raw.data.media, canonicalUrl),
    eventRefs: (raw.data.eventRefs || []).map((ref) => ({
      eventId: ref.eventId,
      role: ref.role,
      label: ref.label,
      links: normalizeLinks(ref.links),
      meta: ref.meta || {},
    })),
    canonicalUrl,
    legacyUrls,
    meta: {
      nativePath: raw.nativePath,
      sourceMeta: {},
      assets: raw.assets,
      coAuthors: raw.data.coAuthors || [],
    },
  });
}

function normalizePost(raw) {
  const slug = raw.data.slug || raw.slug;
  const series = raw.data.series;
  const canonicalUrl = normalizeUrlPath(raw.data.canonicalUrl || `/blog/${slug}/`);
  const legacyUrls = (raw.data.legacyUrls || [])
    .map(normalizeLegacyUrl)
    .filter((legacyUrl) => legacyUrl !== canonicalUrl);

  if (!POST_SERIES.has(series)) {
    throw new Error(`Invalid post series "${series}" at ${raw.nativePath}`);
  }

  return removeUndefined({
    id: raw.data.id || `${series}/${slug}`,
    source: raw.data.source || raw.source,
    docType: raw.data.docType,
    series,
    slug,
    title: raw.data.title,
    summary: raw.data.summary,
    body: {
      markdown: raw.body,
    },
    dates: normalizeDates(raw.data.dates || raw.data),
    taxonomy: normalizeTaxonomy(raw.data.taxonomy || raw.data),
    media: normalizeMedia(raw.data.media, canonicalUrl),
    review: normalizeReview(raw.data),
    canonicalUrl,
    legacyUrls,
    meta: {
      nativePath: raw.nativePath,
      sourceMeta: raw.data.meta?.sourceMeta || {},
      assets: raw.assets,
    },
  });
}

function normalizePage(raw) {
  const slug = raw.data.slug || raw.slug;
  const canonicalUrl = normalizeUrlPath(raw.data.canonicalUrl || `/${slug}/`);
  const legacyUrls = (raw.data.legacyUrls || [])
    .map(normalizeLegacyUrl)
    .filter((legacyUrl) => legacyUrl !== canonicalUrl);

  return removeUndefined({
    id: raw.data.id || slug,
    source: raw.data.source || raw.source,
    docType: raw.data.docType || "page",
    slug,
    title: raw.data.title,
    summary: raw.data.summary,
    body: {
      markdown: raw.body,
    },
    dates: normalizeDates(raw.data.dates || raw.data),
    taxonomy: normalizeTaxonomy(raw.data.taxonomy || raw.data),
    media: normalizeMedia(raw.data.media, canonicalUrl),
    canonicalUrl,
    legacyUrls,
    meta: {
      nativePath: raw.nativePath,
      sourceMeta: raw.data.meta?.sourceMeta || {},
      assets: raw.assets,
    },
  });
}

function normalizeEvent(raw) {
  const event = raw.data;
  const slug = event.slug || event.id;
  const canonicalUrl = normalizeUrlPath(event.canonicalUrl || `/events/${slug}/`);

  return {
    id: event.id,
    slug,
    title: event.title,
    summary: event.summary,
    dates: {
      start: normalizeDate(event.dates?.start),
      end: normalizeDate(event.dates?.end),
      sort: normalizeDate(event.dates?.sort || event.dates?.start || event.dates?.end),
    },
    location: event.location,
    links: normalizeLinks(event.links),
    canonicalUrl,
    legacyUrls: (event.legacyUrls || []).map(normalizeUrlPath).filter((legacyUrl) => legacyUrl !== canonicalUrl),
    meta: {
      sourceKeys: [event.id],
      sourceMeta: [],
      aliases: event.meta?.aliases || [event.title],
      nativePath: raw.nativePath,
    },
  };
}

function staticRedirects() {
  return [
    {
      from: "/blog.html",
      to: "/blog/",
      status: 301,
      source: "digital-zuihitsu",
      reason: "legacy-path",
    },
    {
      from: "/blog/gamelog.html",
      to: "/blog/?series=gamelog",
      status: 301,
      source: "digital-zuihitsu",
      reason: "collection-change",
      keepQuery: false,
    },
    {
      from: "/blog/dungeonlog.html",
      to: "/blog/?series=dungeonlog",
      status: 301,
      source: "digital-zuihitsu",
      reason: "collection-change",
      keepQuery: false,
    },
  ];
}

function makeRedirects(records) {
  return [
    ...records.flatMap((record) =>
      record.legacyUrls.map((legacyUrl) => ({
        from: legacyUrl,
        to: record.canonicalUrl,
        status: 301,
        source: record.source || SOURCE,
        reason: "canonicalization",
      })),
    ),
    ...staticRedirects(),
  ];
}

export function validateRedirects(redirects) {
  const fromValues = new Set();
  const toValues = new Set(redirects.map((redirect) => redirect.to));

  for (const redirect of redirects) {
    if (fromValues.has(redirect.from)) {
      throw new Error(`Duplicate redirect source: ${redirect.from}`);
    }
    fromValues.add(redirect.from);

    if (toValues.has(redirect.from)) {
      throw new Error(`Redirect chain detected at: ${redirect.from}`);
    }
  }
}

function validateContent(documents, events) {
  const eventIds = new Set(events.map((event) => event.id));
  const documentIds = new Set();
  const canonicalUrls = new Set();

  for (const document of documents) {
    if (!document.id || !document.title || !document.canonicalUrl) {
      throw new Error(`Invalid document record at ${document.meta.nativePath}`);
    }

    if (documentIds.has(document.id)) {
      throw new Error(`Duplicate document id: ${document.id}`);
    }
    documentIds.add(document.id);

    if (canonicalUrls.has(document.canonicalUrl)) {
      throw new Error(`Duplicate document canonical URL: ${document.canonicalUrl}`);
    }
    canonicalUrls.add(document.canonicalUrl);

    for (const ref of document.eventRefs || []) {
      if (!eventIds.has(ref.eventId)) {
        throw new Error(`Document ${document.id} references missing event ${ref.eventId}`);
      }
    }
  }
}

function sortDocuments(left, right) {
  const leftSort = left.dates?.sort || "";
  const rightSort = right.dates?.sort || "";
  return rightSort.localeCompare(leftSort) || left.title.localeCompare(right.title);
}

export function normalizeContent({ talks = [], events = [], posts = [], pages = [] }) {
  const documents = [...pages.map(normalizePage), ...talks.map(normalizeTalk), ...posts.map(normalizePost)];
  const normalizedEvents = events.map(normalizeEvent);

  validateContent(documents, normalizedEvents);

  const sortedEvents = normalizedEvents.sort((left, right) => {
    const leftSort = left.dates.sort || "";
    const rightSort = right.dates.sort || "";
    return rightSort.localeCompare(leftSort) || left.title.localeCompare(right.title);
  });
  const redirects = makeRedirects([...documents, ...sortedEvents]);

  validateRedirects(redirects);

  return {
    documents: documents.sort(sortDocuments),
    events: sortedEvents,
    redirects,
  };
}
