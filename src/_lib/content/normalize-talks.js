import path from "node:path";
import { normalizeUrlPath, slugify } from "./slug.js";

const SOURCE = "website";

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

function normalizeTalk(raw) {
  const slug = raw.data.slug || raw.slug;
  const id = raw.data.id || slug;
  const canonicalUrl = normalizeUrlPath(raw.data.canonicalUrl || `/talks/${slug}/`);
  const legacyUrls = (raw.data.legacyUrls || [])
    .map(normalizeUrlPath)
    .filter((legacyUrl) => legacyUrl !== canonicalUrl);

  return {
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
  };
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

function makeRedirects(records) {
  return records.flatMap((record) =>
    record.legacyUrls.map((legacyUrl) => ({
      from: legacyUrl,
      to: record.canonicalUrl,
      status: 301,
      source: SOURCE,
      reason: "canonicalization",
    })),
  );
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
  const slugs = new Set();

  for (const document of documents) {
    if (!document.id || !document.title || !document.canonicalUrl) {
      throw new Error(`Invalid talk record at ${document.meta.nativePath}`);
    }

    if (documentIds.has(document.id)) {
      throw new Error(`Duplicate document id: ${document.id}`);
    }
    documentIds.add(document.id);

    if (slugs.has(document.slug)) {
      throw new Error(`Duplicate document slug: ${document.slug}`);
    }
    slugs.add(document.slug);

    for (const ref of document.eventRefs || []) {
      if (!eventIds.has(ref.eventId)) {
        throw new Error(`Talk ${document.id} references missing event ${ref.eventId}`);
      }
    }
  }
}

export function normalizeContent({ talks, events }) {
  const documents = talks.map(normalizeTalk);
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
    documents: documents.sort((left, right) => left.title.localeCompare(right.title)),
    events: sortedEvents,
    redirects,
  };
}

export function normalizeTalks(rawTalks, rawEvents = []) {
  return normalizeContent({ talks: rawTalks, events: rawEvents });
}
