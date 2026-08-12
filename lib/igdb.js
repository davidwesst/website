import { existsSync, readFileSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const IGDB_CACHE_SCHEMA_VERSION = 4;
export const IGDB_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const IGDB_API_BATCH_SIZE = 500;
export const IGDB_API_INTERVAL_MS = 334;

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const GAMES_URL = "https://api.igdb.com/v4/games";
const IMAGE_ROOT = "https://images.igdb.com/igdb/image/upload/t_1080p";
const RETRYABLE_STATUS = (status) => status === 429 || status >= 500;
const REJECTED_BANNER_IMAGE_IDS = new Set([
  "ar5f0u",
  "ar582n",
  "ar2skz",
  "ar3v7r",
]);
const AGE_RATING_ORGANIZATION_ORDER = ["ESRB", "PEGI", "CERO"];
const AGE_RATING_ORGANIZATION_ALIASES = new Map([
  ["ESRB", "ESRB"],
  ["ENTERTAINMENT SOFTWARE RATING BOARD", "ESRB"],
  ["PEGI", "PEGI"],
  ["PAN EUROPEAN GAME INFORMATION", "PEGI"],
  ["CERO", "CERO"],
  ["COMPUTER ENTERTAINMENT RATING ORGANIZATION", "CERO"],
]);

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function toDate(value) {
  if (!Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString().slice(0, 10);
}

function normalizeRatingOrganization(value) {
  if (!value) return null;
  return AGE_RATING_ORGANIZATION_ALIASES.get(String(value).trim().toUpperCase()) || null;
}

export function normalizeAgeRatings(ageRatings = []) {
  const ratings = new Map();
  for (const entry of ageRatings) {
    const organization = normalizeRatingOrganization(entry.organization?.name || entry.organization);
    const rating = entry.rating_category?.rating || entry.rating_category?.name || entry.rating;
    if (organization && rating && !ratings.has(organization)) ratings.set(organization, String(rating));
  }

  return AGE_RATING_ORGANIZATION_ORDER
    .filter((organization) => ratings.has(organization))
    .map((organization) => ({ organization, rating: ratings.get(organization) }));
}

function compareImages(left, right) {
  const targetRatio = 16 / 9;
  const ratioDifference = Math.abs(left.width / left.height - targetRatio) - Math.abs(right.width / right.height - targetRatio);
  if (ratioDifference !== 0) return ratioDifference;
  const areaDifference = right.width * right.height - left.width * left.height;
  if (areaDifference !== 0) return areaDifference;
  return String(left.image_id).localeCompare(String(right.image_id));
}

export function selectBanner(rawGame) {
  const landscape = (images) => (images || [])
    .filter((image) => image.image_id && !REJECTED_BANNER_IMAGE_IDS.has(image.image_id) && image.width > image.height && image.height > 0)
    .sort(compareImages)[0];
  const artwork = landscape(rawGame.artworks);
  if (artwork) return { ...artwork, kind: "artwork" };
  const screenshot = landscape(rawGame.screenshots);
  return screenshot ? { ...screenshot, kind: "screenshot" } : null;
}

export function normalizeGame(rawGame) {
  const selected = selectBanner(rawGame);
  const involvedCompanies = rawGame.involved_companies || [];
  const game = {
    id: rawGame.id,
    name: rawGame.name,
    firstReleaseDate: toDate(rawGame.first_release_date),
    developers: uniqueSorted(involvedCompanies.filter((entry) => entry.developer).map((entry) => entry.company?.name)),
    publishers: uniqueSorted(involvedCompanies.filter((entry) => entry.publisher).map((entry) => entry.company?.name)),
    series: uniqueSorted((rawGame.collections || []).map((collection) => collection.name)),
    ageRatings: normalizeAgeRatings(rawGame.age_ratings),
    sourceUrl: rawGame.url || null,
    banner: selected ? {
      src: `/assets/igdb/${rawGame.id}-${selected.image_id}.jpg`,
      alt: selected.kind === "artwork" ? `Official artwork for ${rawGame.name}` : `Screenshot from ${rawGame.name}`,
      credit: "Image via IGDB",
      kind: selected.kind,
    } : null,
  };
  return {
    game,
    image: selected ? {
      url: `${IMAGE_ROOT}/${selected.image_id}.jpg`,
      filename: `${rawGame.id}-${selected.image_id}.jpg`,
    } : null,
  };
}

export function buildGamesQuery(ids) {
  const values = [...new Set(ids)].sort((left, right) => left - right).join(",");
  return [
    "fields id,name,url,first_release_date,artworks.image_id,artworks.width,artworks.height,screenshots.image_id,screenshots.width,screenshots.height,involved_companies.developer,involved_companies.publisher,involved_companies.company.name,collections.name,age_ratings.organization.name,age_ratings.rating_category.rating;",
    `where id = (${values});`,
    `limit ${IGDB_API_BATCH_SIZE};`,
  ].join("\n");
}

function retryDelay(response, attempt, random) {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return Math.min(8_000, 500 * 2 ** attempt) + Math.floor(random() * 250);
}

async function responseError(response) {
  let detail = "";
  try {
    const body = await response.text();
    if (body) detail = `: ${body.slice(0, 500)}`;
  } catch {
    // Response bodies are best-effort diagnostics only.
  }
  return detail;
}

export async function fetchWithRetry(url, options, {
  fetchImpl = globalThis.fetch,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  random = Math.random,
  maxRetries = 3,
} = {}) {
  let response;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      response = await fetchImpl(url, options);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(Math.min(8_000, 500 * 2 ** attempt) + Math.floor(random() * 250));
      continue;
    }
    if (response.ok || !RETRYABLE_STATUS(response.status) || attempt === maxRetries) return response;
    await sleep(retryDelay(response, attempt, random));
  }
  return response;
}

function chunks(values, size) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size));
}

async function accessToken(clientId, clientSecret, dependencies) {
  const response = await fetchWithRetry(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
  }, dependencies);
  if (!response.ok) throw new Error(`Twitch authentication failed with HTTP ${response.status}${await responseError(response)}`);
  const body = await response.json();
  if (!body.access_token) throw new Error("Twitch authentication response did not include an access token");
  return body.access_token;
}

async function fetchGames(ids, clientId, token, dependencies) {
  const games = [];
  const batches = chunks(ids, IGDB_API_BATCH_SIZE);
  for (let index = 0; index < batches.length; index += 1) {
    if (index > 0) await dependencies.sleep(IGDB_API_INTERVAL_MS);
    const response = await fetchWithRetry(GAMES_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Client-ID": clientId,
      },
      body: buildGamesQuery(batches[index]),
    }, dependencies);
    if (!response.ok) throw new Error(`IGDB games request failed with HTTP ${response.status}${await responseError(response)}`);
    games.push(...await response.json());
  }
  return games;
}

function summarizeIdMismatch(expectedIds, returnedIds) {
  const returned = new Set(returnedIds);
  const expected = new Set(expectedIds);
  const missing = expectedIds.filter((id) => !returned.has(id));
  const unexpected = returnedIds.filter((id) => !expected.has(id));
  const details = [];
  if (missing.length > 0) details.push(`missing: ${missing.join(", ")}`);
  if (unexpected.length > 0) details.push(`unexpected: ${unexpected.join(", ")}`);
  return details.length > 0 ? ` (${details.join("; ")})` : "";
}

function cacheIds(manifest) {
  return Object.keys(manifest?.games || {}).map(Number).sort((left, right) => left - right);
}

export function isFreshManifest(manifest, ids, now = Date.now()) {
  if (manifest?.schemaVersion !== IGDB_CACHE_SCHEMA_VERSION || !Number.isFinite(Date.parse(manifest.fetchedAt))) return false;
  const expected = [...new Set(ids)].sort((left, right) => left - right);
  if (JSON.stringify(cacheIds(manifest)) !== JSON.stringify(expected)) return false;
  const age = now - Date.parse(manifest.fetchedAt);
  return age >= 0 && age < IGDB_CACHE_TTL_MS;
}

export function readIgdbManifest(cacheDirectory = path.resolve(".cache", "igdb")) {
  const manifestPath = path.join(cacheDirectory, "manifest.json");
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

export function hasCachedImages(manifest, cacheDirectory = path.resolve(".cache", "igdb")) {
  return Object.values(manifest?.games || {}).every((game) => !game.banner
    || existsSync(path.join(cacheDirectory, "images", path.basename(game.banner.src))));
}

function usableStaleManifest(manifest, ids, cacheDirectory) {
  if (manifest?.schemaVersion !== IGDB_CACHE_SCHEMA_VERSION || !manifest.games || typeof manifest.games !== "object") return false;
  return JSON.stringify(cacheIds(manifest)) === JSON.stringify(ids) && hasCachedImages(manifest, cacheDirectory);
}

async function concurrentMap(values, concurrency, operation) {
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (next < values.length) {
      const index = next;
      next += 1;
      await operation(values[index], index);
    }
  });
  await Promise.all(workers);
}

export async function prepareIgdb({
  ids,
  cacheDirectory = path.resolve(".cache", "igdb"),
  clientId = process.env.IGDB_CLIENT_ID,
  clientSecret = process.env.IGDB_CLIENT_SECRET,
  now = Date.now(),
  fetchImpl = globalThis.fetch,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  random = Math.random,
  logger = console,
  forceRefresh = false,
} = {}) {
  const expectedIds = [...new Set(ids || [])].sort((left, right) => left - right);
  const existing = readIgdbManifest(cacheDirectory);
  if (!forceRefresh && isFreshManifest(existing, expectedIds, now) && hasCachedImages(existing, cacheDirectory)) return { status: "fresh", manifest: existing };
  if (!clientId || !clientSecret) {
    logger.warn("IGDB credentials are unavailable; using stale data or existing placeholders.");
    return { status: usableStaleManifest(existing, expectedIds, cacheDirectory) ? "stale" : "empty", manifest: usableStaleManifest(existing, expectedIds, cacheDirectory) ? existing : null };
  }

  const dependencies = { fetchImpl, sleep, random, maxRetries: 3 };
  const stageDirectory = await mkdtemp(path.join(tmpdir(), "website-igdb-"));
  try {
    const token = await accessToken(clientId, clientSecret, dependencies);
    const rawGames = await fetchGames(expectedIds, clientId, token, dependencies);
    const returnedIds = rawGames.map((game) => game.id).sort((left, right) => left - right);
    if (JSON.stringify(returnedIds) !== JSON.stringify(expectedIds)) {
      throw new Error(`IGDB did not return every requested game ID${summarizeIdMismatch(expectedIds, returnedIds)}`);
    }

    const normalized = rawGames.map(normalizeGame);
    await concurrentMap(normalized.filter((entry) => entry.image), 2, async (entry) => {
      const response = await fetchWithRetry(entry.image.url, { headers: { Accept: "image/*" } }, dependencies);
      if (!response.ok) {
        logger.warn(`IGDB image download failed for game ${entry.game.id}; retaining metadata without a banner.`);
        entry.game.banner = null;
        return;
      }
      await writeFile(path.join(stageDirectory, entry.image.filename), Buffer.from(await response.arrayBuffer()));
    });

    const games = Object.fromEntries(normalized.map(({ game }) => [game.id, game]));
    const manifest = { schemaVersion: IGDB_CACHE_SCHEMA_VERSION, fetchedAt: new Date(now).toISOString(), games };
    await mkdir(path.join(cacheDirectory, "images"), { recursive: true });
    for (const entry of normalized.filter(({ game, image }) => game.banner && image)) {
      await copyFile(path.join(stageDirectory, entry.image.filename), path.join(cacheDirectory, "images", entry.image.filename));
    }
    await mkdir(cacheDirectory, { recursive: true });
    const temporaryManifest = path.join(cacheDirectory, "manifest.json.tmp");
    await writeFile(temporaryManifest, `${JSON.stringify(manifest, null, 2)}\n`);
    await rename(temporaryManifest, path.join(cacheDirectory, "manifest.json"));
    return { status: "refreshed", manifest };
  } catch (error) {
    logger.warn(`IGDB refresh failed: ${error.message}. Using stale data or existing placeholders.`);
    return { status: usableStaleManifest(existing, expectedIds, cacheDirectory) ? "stale" : "empty", manifest: usableStaleManifest(existing, expectedIds, cacheDirectory) ? existing : null };
  } finally {
    await rm(stageDirectory, { recursive: true, force: true });
  }
}
