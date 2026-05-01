import assert from "node:assert/strict";
import { loadEvents, loadTalks } from "../src/_lib/content/loaders/local-content.js";
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
  return normalizeTalks(loadTalks(), loadEvents());
}

test("loads canonical talks and events from the new website", () => {
  const talks = loadTalks();
  const events = loadEvents();

  assert.equal(talks.length, 10);
  assert.equal(events.length, 14);
  assert.ok(talks.every((talk) => talk.source === "website"));
  assert.ok(events.every((event) => event.source === "website"));
  assert.ok(talks.every((talk) => talk.data.title));
});

test("normalizes talks into canonical talk documents", () => {
  const { documents } = normalizeLocalContent();

  assert.equal(documents.length, 10);
  assert.ok(documents.every((document) => document.docType === "talk"));
  assert.ok(documents.every((document) => document.series === "talks"));
  assert.ok(documents.every((document) => document.canonicalUrl.startsWith("/talks/")));
});

test("corrects typoed talk slug and preserves legacy URL as redirect source", () => {
  const { documents, redirects } = normalizeLocalContent();
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
  const { events } = normalizeLocalContent();

  assert.equal(events.filter((event) => event.id === "prairiedevcon-2022-regina").length, 1);
  assert.equal(events.filter((event) => event.id === "prairiedevcon-2022-winnipeg").length, 1);
  assert.equal(events.filter((event) => event.id === "prairiedevcon-2022-calgary").length, 1);
});

test("keeps talk-specific resources off shared event records", () => {
  const { documents, events } = normalizeLocalContent();
  const event = events.find((event) => event.id === "canheit-2025");
  const talk = documents.find((document) => document.id === "modernization-journey");
  const eventRef = talk.eventRefs.find((ref) => ref.eventId === event.id);

  assert.deepEqual(event.links, []);
  assert.equal(eventRef.links.length, 1);
  assert.equal(eventRef.links[0].label, "Slides (PDF)");
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
