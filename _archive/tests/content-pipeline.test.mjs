import assert from "node:assert/strict";
import { loadEvents, loadPages, loadPosts, loadTalks } from "../src/_lib/content/loaders/local-content.js";
import { normalizeContent } from "../src/_lib/content/normalize-content.js";
import { normalizeTalks, validateRedirects } from "../src/_lib/content/normalize-talks.js";

function test(name, callback) {
  try {
    callback();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function normalizeLocalContent() {
  return normalizeContent({ talks: loadTalks(), events: loadEvents(), posts: loadPosts(), pages: loadPages() });
}

function normalizeTalkContent() {
  return normalizeTalks(loadTalks(), loadEvents());
}

function countBy(values, predicate) {
  return values.filter(predicate).length;
}

function withoutSourceMeta(value) {
  if (Array.isArray(value)) {
    return value.map(withoutSourceMeta);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "sourceMeta")
        .map(([key, item]) => [key, withoutSourceMeta(item)]),
    );
  }

  return value;
}

test("loads canonical talks and events from the new website", () => {
  const talks = loadTalks();
  const events = loadEvents();

  assert.ok(talks.length > 0);
  assert.ok(events.length > 0);
  assert.ok(talks.every((talk) => talk.source === "website"));
  assert.ok(events.every((event) => event.source === "website"));
  assert.ok(talks.every((talk) => talk.data.title));
});

test("normalizes talks into canonical talk documents", () => {
  const talks = loadTalks();
  const { documents } = normalizeTalkContent();

  assert.equal(documents.length, talks.length);
  assert.ok(documents.every((document) => document.docType === "talk"));
  assert.ok(documents.every((document) => document.series === "talks"));
  assert.ok(documents.every((document) => document.canonicalUrl.startsWith("/talks/")));
});

test("corrects typoed talk slug and preserves legacy URL as redirect source", () => {
  const { documents, redirects } = normalizeTalkContent();
  const talk = documents.find((document) => document.title.startsWith("Consensus in the Chaos"));

  assert.equal(talk.slug, "consensus-in-the-chaos");
  assert.equal(talk.canonicalUrl, "/talks/consensus-in-the-chaos/");
  assert.deepEqual(talk.legacyUrls, ["/talks/concensus-in-the-chaos/"]);
  assert.ok(
    redirects.some(
      (redirect) =>
        redirect.from === "/talks/concensus-in-the-chaos/" &&
        redirect.to === "/talks/consensus-in-the-chaos/" &&
        redirect.status === 301,
    ),
  );
});

test("dedupes shared Prairie Dev Con 2022 events by explicit event id", () => {
  const { events } = normalizeTalkContent();

  assert.equal(events.filter((event) => event.id === "prairiedevcon-2022-regina").length, 1);
  assert.equal(events.filter((event) => event.id === "prairiedevcon-2022-winnipeg").length, 1);
  assert.equal(events.filter((event) => event.id === "prairiedevcon-2022-calgary").length, 1);
});

test("keeps talk-specific resources off shared event records", () => {
  const { documents, events } = normalizeTalkContent();
  const event = events.find((event) => event.id === "canheit-2025");
  const talk = documents.find((document) => document.id === "modernization-journey");
  const eventRef = talk.eventRefs.find((ref) => ref.eventId === event.id);

  assert.deepEqual(event.links, []);
  assert.equal(eventRef.links.length, 1);
  assert.equal(eventRef.links[0].label, "Slides (PDF)");
});

test("loads migrated post content from the new website", () => {
  const posts = loadPosts();

  assert.ok(posts.some((post) => post.data.series === "blog"));
  assert.ok(posts.some((post) => post.data.series === "gamelog"));
  assert.ok(posts.some((post) => post.data.series === "dungeonlog"));
  assert.ok(posts.every((post) => post.nativePath.includes("src\\content\\posts") || post.nativePath.includes("src/content/posts")));
});

test("loads canonical page content from the new website", () => {
  const pages = loadPages();
  const pageIds = pages.map((page) => page.data.id).sort();

  assert.ok(pageIds.includes("about"));
  assert.ok(pageIds.includes("projects"));
  assert.ok(pages.every((page) => page.data.docType === "page"));
  assert.ok(pages.some((page) => page.data.canonicalUrl === "/about/"));
  assert.ok(pages.some((page) => page.data.canonicalUrl === "/projects/"));
  assert.ok(pages.every((page) => page.nativePath.includes("src\\content\\pages") || page.nativePath.includes("src/content/pages")));
});

test("normalizes migrated posts into shared document records", () => {
  const loadedPosts = loadPosts();
  const { documents } = normalizeLocalContent();
  const posts = documents.filter((document) => ["blog", "gamelog", "dungeonlog"].includes(document.series));

  assert.equal(posts.length, loadedPosts.length);
  assert.equal(countBy(posts, (post) => post.docType === "post"), countBy(loadedPosts, (post) => post.data.series === "blog"));
  assert.equal(countBy(posts, (post) => post.docType === "review"), countBy(loadedPosts, (post) => post.data.series === "gamelog"));
  assert.equal(countBy(posts, (post) => post.docType === "session"), countBy(loadedPosts, (post) => post.data.series === "dungeonlog"));
});

test("normalizes migrated pages into shared document records", () => {
  const { documents, redirects } = normalizeLocalContent();
  const about = documents.find((document) => document.id === "about");
  const projects = documents.find((document) => document.id === "projects");

  assert.equal(about.docType, "page");
  assert.equal(about.slug, "about");
  assert.equal(about.canonicalUrl, "/about/");
  assert.deepEqual(about.legacyUrls, ["/about.html"]);
  assert.equal(projects.docType, "page");
  assert.equal(projects.slug, "projects");
  assert.equal(projects.canonicalUrl, "/projects/");
  assert.ok(projects.legacyUrls.includes("/cocoboko-studios.html"));
  assert.ok(projects.legacyUrls.includes("/remember-the-human.html"));
  assert.ok(
    redirects.some(
      (redirect) => redirect.from === "/about.html" && redirect.to === "/about/" && redirect.status === 301,
    ),
  );
  assert.ok(
    redirects.some(
      (redirect) =>
        redirect.from === "/cocoboko-studios.html" && redirect.to === "/projects/" && redirect.status === 301,
    ),
  );
  assert.ok(
    redirects.some(
      (redirect) =>
        redirect.from === "/remember-the-human.html" && redirect.to === "/projects/" && redirect.status === 301,
    ),
  );
});

test("preserves davidwesst.github.io blog URL structure", () => {
  const { documents, redirects } = normalizeLocalContent();
  const post = documents.find((document) => document.id === "blog/from-11ty-to-wordpress-and-back-again");

  assert.equal(post.canonicalUrl, "/blog/from-11ty-to-wordpress-and-back-again/");
  assert.ok(post.legacyUrls.includes("/blog/from-11ty-to-wordpress-and-back-again/index.html"));
  assert.ok(
    redirects.some(
      (redirect) =>
        redirect.from === "/blog/from-11ty-to-wordpress-and-back-again/index.html" &&
        redirect.to === "/blog/from-11ty-to-wordpress-and-back-again/",
    ),
  );
});

test("redirects legacy gamelog routes to canonical gamelog documents", () => {
  const { documents, redirects } = normalizeLocalContent();
  const post = documents.find((document) => document.id === "gamelog/blue-prince");

  assert.equal(post.canonicalUrl, "/blog/gamelog/blue-prince/");
  assert.ok(post.legacyUrls.includes("/gamelog/blue-prince/"));
  assert.ok(post.legacyUrls.includes("/blog/gamelog/entry.html?slug=blue-prince"));
  assert.ok(
    redirects.some(
      (redirect) =>
        redirect.from === "/blog/gamelog/entry.html?slug=blue-prince" &&
        redirect.to === "/blog/gamelog/blue-prince/",
    ),
  );
});

test("keeps gamelog supplemental data in review metadata", () => {
  const { documents } = normalizeLocalContent();
  const post = documents.find((document) => document.id === "gamelog/blue-prince");

  assert.equal(post.review.subjectIds.igdb_id, 149657);
  assert.equal(post.review.play.platform, "XBox Series X");
  assert.equal(post.review.rating.overall, 3);
});

test("keeps gamelog front matter focused on canonical fields", () => {
  const gamelogs = loadPosts().filter((post) => post.data.series === "gamelog");

  assert.ok(gamelogs.every((post) => !post.data.dates.sort));
  assert.ok(gamelogs.every((post) => !post.data.meta?.sourceMeta));
});

test("keeps source-specific front matter out of canonical records", () => {
  const { documents } = normalizeLocalContent();
  const canonicalJson = JSON.stringify(documents.map(withoutSourceMeta));

  assert.equal(canonicalJson.includes("featured_image"), false);
  assert.equal(canonicalJson.includes("title_image"), false);
  assert.equal(canonicalJson.includes("play_data"), false);
  assert.equal(canonicalJson.includes("game_ids"), false);
});

test("redirect validation rejects duplicates and chains", () => {
  assert.throws(
    () =>
      validateRedirects([
        { from: "/old/", to: "/new/" },
        { from: "/old/", to: "/newer/" },
      ]),
    /Duplicate redirect source/,
  );

  assert.throws(
    () =>
      validateRedirects([
        { from: "/old/", to: "/new/" },
        { from: "/new/", to: "/newer/" },
      ]),
    /Redirect chain detected/,
  );
});
