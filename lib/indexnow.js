import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

export function validateUrl(value, origin) {
  const url = new URL(value);
  assert.ok(url.origin === origin && url.protocol === "https:" && url.pathname.endsWith("/") && !url.search && !url.hash && !url.username && !url.password, `Invalid canonical IndexNow URL: ${value}`);
  return url.href;
}
export function sitemapUrls(xml, origin) {
  const $ = load(xml, { xmlMode: true });
  assert.equal($("urlset").length, 1, "Expected an XML URL sitemap");
  const urls = [...new Set($("url > loc").map((_, element) => validateUrl($(element).text(), origin)).get())].sort();
  assert.ok(urls.length, "Sitemap must contain canonical pages");
  return urls;
}
export async function createIndexManifest(root, origin) {
  const pages = {};
  const assetHashes = new Map();
  for (const url of sitemapUrls(await readFile(path.join(root, "sitemap.xml"), "utf8"), origin)) {
    const html = await readFile(path.join(root, new URL(url).pathname, "index.html"), "utf8");
    const $ = load(html);
    assert.equal($('link[rel="canonical"]').attr("href"), url, `Canonical mismatch: ${url}`);
    assert.ok(!$('meta[name="robots"]').attr("content")?.includes("noindex"), `Noindex in sitemap: ${url}`);
    const assets = new Set();
    for (const element of $("img[src], source[srcset], script[src], link[rel=stylesheet], link[rel=icon], meta[property='og:image']").toArray()) {
      const el = $(element);
      for (const ref of [el.attr("src"), el.attr("href"), el.attr("content"), ...(el.attr("srcset") || "").split(",").map((part) => part.trim().split(/\s+/)[0])].filter(Boolean)) {
        const resource = new URL(ref, url);
        if (resource.origin === origin) assets.add(decodeURIComponent(resource.pathname));
      }
    }
    const hash = createHash("sha256").update(html);
    for (const asset of [...assets].sort()) {
      if (!assetHashes.has(asset)) assetHashes.set(asset, createHash("sha256").update(await readFile(path.join(root, asset))).digest("hex"));
      hash.update(asset).update(assetHashes.get(asset));
    }
    pages[url] = hash.digest("hex");
  }
  return { schemaVersion: 1, pages };
}
export function validateState(state, origin) {
  assert.ok(state?.schemaVersion === 1 && state.baseline && Array.isArray(state.pending), "Missing or invalid IndexNow baseline; recover it explicitly");
  for (const [url, hash] of Object.entries(state.baseline)) {
    validateUrl(url, origin);
    assert.ok(hash === null || /^[a-f0-9]{64}$/.test(hash), `Invalid baseline hash: ${url}`);
  }
  state.pending.forEach((url) => validateUrl(url, origin));
  return state;
}
export function pendingUrls(state, manifest, origin) {
  validateState(state, origin);
  assert.equal(manifest.schemaVersion, 1);
  const changed = Object.entries(manifest.pages).filter(([url, hash]) => { validateUrl(url, origin); return state.baseline[url] !== hash; }).map(([url]) => url);
  const removed = Object.keys(state.baseline).filter((url) => !(url in manifest.pages));
  return [...new Set([...state.pending, ...changed, ...removed])].sort();
}
export async function verifyIndexNowKey({ origin, key, fetchFn = fetch }) {
  const keyLocation = `${origin}/${key}.txt`;
  const response = await fetchFn(keyLocation, { redirect: "manual", signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, `IndexNow ownership file must return 200: ${keyLocation}`);
  assert.equal((await response.text()).trim(), key, `IndexNow ownership file contents do not match: ${keyLocation}`);
  return true;
}

function rejection(response, endpoint, detail, suffix = "") {
  return new Error(`IndexNow rejected batch: HTTP ${response.status}; endpoint ${endpoint}${detail ? `; response ${detail}` : ""}${suffix}`);
}

export async function submitIndexNow({ state, manifest, origin, key, endpoint, fetchFn = fetch, verifyKey, onRetry = () => {}, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), batchSize = 10000 }) {
  assert.match(key, /^[a-zA-Z0-9-]{8,128}$/);
  assert.ok(batchSize > 0 && batchSize <= 10000);
  state.pending = pendingUrls(state, manifest, origin);
  for (let offset = 0; offset < state.pending.length; offset += batchSize) {
    const payload = { host: new URL(origin).host, key, keyLocation: `${origin}/${key}.txt`, urlList: state.pending.slice(offset, offset + batchSize) };
    let accepted = false;
    let maxAttempts = 3;
    let lastFailure;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let response;
      try { response = await fetchFn(endpoint, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) }); }
      catch (error) { lastFailure = error; if (attempt === maxAttempts - 1) throw error; }
      if ([200, 202].includes(response?.status)) { accepted = true; break; }
      let ownershipPending = false;
      if (response) {
        let body;
        try { body = await response.text?.(); }
        catch (error) { body = `Response body unavailable: ${error.message}`; }
        const detail = String(body || "").replace(/[\x00-\x1f\x7f]/g, " ").slice(0, 500);
        lastFailure = rejection(response, endpoint, detail);
        if (response.status === 403 && verifyKey) {
          // A newly published key can be visible locally before the service validates it.
          try { ownershipPending = await verifyKey() === true; }
          catch (error) { throw rejection(response, endpoint, detail, `; ownership check failed: ${error.message}`); }
          if (ownershipPending) maxAttempts = 5;
        }
        if (!ownershipPending && response.status !== 429 && response.status < 500) throw lastFailure;
      }
      if (attempt < maxAttempts - 1) {
        const retryAfter = Number(response?.headers?.get("retry-after"));
        const delay = Math.min(ownershipPending ? 60000 : 30000, Math.max((ownershipPending ? 15000 : 1000) * 2 ** attempt, Number.isFinite(retryAfter) ? retryAfter * 1000 : 0));
        onRetry({ status: response?.status || null, attempt: attempt + 1, maxAttempts, delay, ownershipPending });
        await sleep(delay);
      }
    }
    if (!accepted) throw new Error(`IndexNow retries exhausted; pending URLs retained; ${lastFailure?.message || "unknown failure"}`);
  }
  const count = state.pending.length;
  state.baseline = { ...manifest.pages };
  state.pending = [];
  return count;
}
