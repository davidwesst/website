import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  IGDB_CACHE_SCHEMA_VERSION,
  IGDB_CACHE_TTL_MS,
  buildGamesQuery,
  fetchWithRetry,
  isFreshManifest,
  normalizeGame,
  prepareIgdb,
  selectBanner,
} from "../lib/igdb.js";
import gamelogData from "../src/content/posts/gamelogs/gamelogs.11tydata.js";

function response(status, body, headers = {}) {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => body,
    arrayBuffer: async () => bytes,
    text: async () => bytes.toString("utf8"),
  };
}

function rawGame(id, overrides = {}) {
  return {
    id,
    name: `Game ${id}`,
    url: `https://www.igdb.com/games/game-${id}`,
    first_release_date: 946684800,
    artworks: [],
    screenshots: [],
    involved_companies: [],
    collections: [],
    ...overrides,
  };
}

async function temporaryDirectory(t) {
  const directory = await mkdtemp(path.join(tmpdir(), "website-igdb-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test("normalizes game metadata and selects deterministic landscape artwork", () => {
  const raw = rawGame(7, {
    name: "A Game",
    artworks: [
      { image_id: "portrait", width: 600, height: 900 },
      { image_id: "smaller", width: 1280, height: 720 },
      { image_id: "larger", width: 1920, height: 1080 },
    ],
    involved_companies: [
      { developer: true, publisher: false, company: { name: "Studio B" } },
      { developer: true, publisher: true, company: { name: "Studio A" } },
      { developer: true, publisher: false, company: { name: "Studio A" } },
    ],
    collections: [{ name: "Series B" }, { name: "Series A" }, { name: "Series A" }],
    age_ratings: [
      { organization: { name: "PEGI" }, rating_category: { rating: "16" } },
      { organization: { name: "Entertainment Software Rating Board" }, rating_category: { rating: "T" } },
      { organization: { name: "CERO" }, rating_category: { rating: "C" } },
      { organization: { name: "USK" }, rating_category: { rating: "12" } },
    ],
  });
  const { game, image } = normalizeGame(raw);
  assert.equal(game.firstReleaseDate, "2000-01-01");
  assert.deepEqual(game.developers, ["Studio A", "Studio B"]);
  assert.deepEqual(game.publishers, ["Studio A"]);
  assert.deepEqual(game.series, ["Series A", "Series B"]);
  assert.deepEqual(game.ageRatings, [
    { organization: "ESRB", rating: "T" },
    { organization: "PEGI", rating: "16" },
    { organization: "CERO", rating: "C" },
  ]);
  assert.equal(game.banner.kind, "artwork");
  assert.match(game.banner.src, /7-larger\.jpg$/);
  assert.match(image.url, /t_1080p\/larger\.jpg$/);
});

test("falls back from portrait artwork to a landscape screenshot", () => {
  const selected = selectBanner(rawGame(8, {
    artworks: [{ image_id: "portrait", width: 600, height: 900 }],
    screenshots: [{ image_id: "screen", width: 1920, height: 1080 }],
  }));
  assert.equal(selected.image_id, "screen");
  assert.equal(selected.kind, "screenshot");
});

test("skips known bad IGDB banner images", () => {
  const selected = selectBanner(rawGame(388426, {
    artworks: [
      { image_id: "ar582n", width: 1920, height: 1080 },
      { image_id: "better-artwork", width: 1280, height: 720 },
    ],
    screenshots: [{ image_id: "screen", width: 1920, height: 1080 }],
  }));
  assert.equal(selected.image_id, "better-artwork");
  assert.equal(selected.kind, "artwork");

  const fallback = selectBanner(rawGame(351273, {
    artworks: [{ image_id: "ar5f0u", width: 1920, height: 1080 }],
    screenshots: [{ image_id: "screen", width: 1920, height: 1080 }],
  }));
  assert.equal(fallback.image_id, "screen");
  assert.equal(fallback.kind, "screenshot");

  const roottreesFallback = selectBanner(rawGame(288983, {
    artworks: [{ image_id: "ar2skz", width: 1920, height: 1080 }],
    screenshots: [{ image_id: "root-screen", width: 1920, height: 1080 }],
  }));
  assert.equal(roottreesFallback.image_id, "root-screen");

  const galleyFallback = selectBanner(rawGame(350434, {
    artworks: [{ image_id: "ar3v7r", width: 1920, height: 1080 }],
    screenshots: [{ image_id: "galley-screen", width: 1920, height: 1080 }],
  }));
  assert.equal(galleyFallback.image_id, "galley-screen");
});

test("computed gamelog data joins IGDB metadata while preserving authored banners", () => {
  const generatedBanner = { src: "/assets/igdb/1-image.jpg" };
  const authoredBanner = { src: "./authored.jpg" };
  const base = { customData: { game: { ids: { igdb: 1 } } }, igdbGames: { 1: { id: 1, banner: generatedBanner } } };
  assert.equal(gamelogData.eleventyComputed.gameMetadata(base).id, 1);
  assert.equal(gamelogData.eleventyComputed.resolvedBanner(base), generatedBanner);
  assert.equal(gamelogData.eleventyComputed.resolvedBanner({ ...base, banner: authoredBanner }), authoredBanner);
  assert.equal(gamelogData.eleventyComputed.gameMetadata({ customData: {}, igdbGames: {} }), null);
});

test("builds one batched query for the current 19 game inventory", () => {
  const query = buildGamesQuery(Array.from({ length: 19 }, (_, index) => index + 1));
  assert.match(query, /where id = \(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19\);/);
  assert.match(query, /involved_companies\.company\.name/);
  assert.match(query, /collections\.name/);
  assert.match(query, /age_ratings\.organization\.name/);
  assert.match(query, /age_ratings\.rating_category\.rating/);
  assert.equal((query.match(/where id/g) || []).length, 1);
});

test("cache freshness expires at exactly 24 hours and rejects future timestamps or changed IDs", () => {
  const now = Date.parse("2026-08-06T12:00:00.000Z");
  const manifest = {
    schemaVersion: IGDB_CACHE_SCHEMA_VERSION,
    fetchedAt: new Date(now - IGDB_CACHE_TTL_MS + 1).toISOString(),
    games: { 1: rawGame(1), 2: rawGame(2) },
  };
  assert.equal(isFreshManifest(manifest, [1, 2], now), true);
  manifest.fetchedAt = new Date(now - IGDB_CACHE_TTL_MS).toISOString();
  assert.equal(isFreshManifest(manifest, [1, 2], now), false);
  manifest.fetchedAt = new Date(now + 1).toISOString();
  assert.equal(isFreshManifest(manifest, [1, 2], now), false);
  manifest.fetchedAt = new Date(now).toISOString();
  assert.equal(isFreshManifest(manifest, [1, 3], now), false);
});

test("honors Retry-After and bounds rate-limit retries", async () => {
  const sleeps = [];
  let calls = 0;
  const result = await fetchWithRetry("https://example.test", {}, {
    fetchImpl: async () => (++calls === 1 ? response(429, {}, { "retry-after": "2" }) : response(200, {})),
    sleep: async (milliseconds) => sleeps.push(milliseconds),
    random: () => 0,
    maxRetries: 3,
  });
  assert.equal(result.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(sleeps, [2000]);

  calls = 0;
  const exhausted = await fetchWithRetry("https://example.test", {}, {
    fetchImpl: async () => { calls += 1; return response(503, {}); },
    sleep: async () => {},
    random: () => 0,
    maxRetries: 3,
  });
  assert.equal(exhausted.status, 503);
  assert.equal(calls, 4);
});

test("refreshes 19 games with one IGDB API request and at most two image downloads in flight", async (t) => {
  const cacheDirectory = await temporaryDirectory(t);
  const ids = Array.from({ length: 19 }, (_, index) => index + 1);
  let gameRequests = 0;
  let activeImages = 0;
  let maximumImages = 0;
  const fetchImpl = async (url) => {
    if (url.includes("oauth2/token")) return response(200, { access_token: "token" });
    if (url.includes("/v4/games")) {
      gameRequests += 1;
      return response(200, ids.map((id) => rawGame(id, {
        artworks: id <= 4 ? [{ image_id: `image-${id}`, width: 1920, height: 1080 }] : [],
      })));
    }
    activeImages += 1;
    maximumImages = Math.max(maximumImages, activeImages);
    await new Promise((resolve) => setTimeout(resolve, 5));
    activeImages -= 1;
    return response(200, Buffer.from("image"));
  };
  const result = await prepareIgdb({
    ids,
    cacheDirectory,
    clientId: "client",
    clientSecret: "secret",
    fetchImpl,
    sleep: async () => {},
    random: () => 0,
  });
  assert.equal(result.status, "refreshed");
  assert.equal(gameRequests, 1);
  assert.equal(maximumImages, 2);
  assert.equal(Object.keys(result.manifest.games).length, 19);
  assert.doesNotMatch(await readFile(path.join(cacheDirectory, "manifest.json"), "utf8"), /token|secret/);
});

test("uses an exact-inventory stale cache when credentials or the API are unavailable", async (t) => {
  const cacheDirectory = await temporaryDirectory(t);
  const manifest = {
    schemaVersion: IGDB_CACHE_SCHEMA_VERSION,
    fetchedAt: "2020-01-01T00:00:00.000Z",
    games: { 1: normalizeGame(rawGame(1)).game },
  };
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(path.join(cacheDirectory, "manifest.json"), JSON.stringify(manifest));
  const warnings = [];
  const withoutCredentials = await prepareIgdb({ ids: [1], cacheDirectory, logger: { warn: (message) => warnings.push(message) } });
  assert.equal(withoutCredentials.status, "stale");

  let calls = 0;
  const failedRefresh = await prepareIgdb({
    ids: [1],
    cacheDirectory,
    clientId: "client",
    clientSecret: "secret",
    fetchImpl: async () => { calls += 1; return response(503, {}); },
    sleep: async () => {},
    random: () => 0,
    logger: { warn: (message) => warnings.push(message) },
  });
  assert.equal(failedRefresh.status, "stale");
  assert.equal(calls, 4);
  assert.deepEqual(JSON.parse(await readFile(path.join(cacheDirectory, "manifest.json"), "utf8")), manifest);
});

test("reports missing IGDB IDs when a batch returns incomplete data", async (t) => {
  const cacheDirectory = await temporaryDirectory(t);
  const warnings = [];
  const result = await prepareIgdb({
    ids: [1, 2],
    cacheDirectory,
    clientId: "client",
    clientSecret: "secret",
    fetchImpl: async (url) => {
      if (url.includes("oauth2/token")) return response(200, { access_token: "token" });
      if (url.includes("/v4/games")) return response(200, [rawGame(1)]);
      return response(200, Buffer.from("image"));
    },
    sleep: async () => {},
    logger: { warn: (message) => warnings.push(message) },
  });

  assert.equal(result.status, "empty");
  const warning = warnings.join("\n");
  assert.match(warning, /missing: 2/);
  assert.doesNotMatch(warning, /returned games:/);
});

test("force refresh bypasses an otherwise fresh cache", async (t) => {
  const cacheDirectory = await temporaryDirectory(t);
  const now = Date.parse("2026-08-06T12:00:00.000Z");
  const manifest = {
    schemaVersion: IGDB_CACHE_SCHEMA_VERSION,
    fetchedAt: new Date(now).toISOString(),
    games: { 1: normalizeGame(rawGame(1, { name: "Cached Game" })).game },
  };
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(path.join(cacheDirectory, "manifest.json"), JSON.stringify(manifest));

  let gameRequests = 0;
  const result = await prepareIgdb({
    ids: [1],
    cacheDirectory,
    clientId: "client",
    clientSecret: "secret",
    now,
    forceRefresh: true,
    fetchImpl: async (url) => {
      if (url.includes("oauth2/token")) return response(200, { access_token: "token" });
      if (url.includes("/v4/games")) {
        gameRequests += 1;
        return response(200, [rawGame(1, { name: "Refreshed Game" })]);
      }
      return response(200, Buffer.from("image"));
    },
    sleep: async () => {},
  });

  assert.equal(result.status, "refreshed");
  assert.equal(gameRequests, 1);
  assert.equal(result.manifest.games[1].name, "Refreshed Game");
});

test("keeps refreshed metadata but omits a banner after a non-retryable image failure", async (t) => {
  const cacheDirectory = await temporaryDirectory(t);
  const fetchImpl = async (url) => {
    if (url.includes("oauth2/token")) return response(200, { access_token: "token" });
    if (url.includes("/v4/games")) return response(200, [rawGame(1, { artworks: [{ image_id: "missing", width: 1920, height: 1080 }] })]);
    return response(404, {});
  };
  const result = await prepareIgdb({
    ids: [1],
    cacheDirectory,
    clientId: "client",
    clientSecret: "secret",
    fetchImpl,
    sleep: async () => {},
    logger: { warn: () => {} },
  });
  assert.equal(result.status, "refreshed");
  assert.equal(result.manifest.games[1].banner, null);
});
