import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import site from "../src/_data/site.js";
import config from "../src/_data/indexnow.js";
import { createIndexManifest, sitemapUrls, submitIndexNow, validateState } from "../lib/indexnow.js";

const command = process.argv[2];
const stateFile = ".cache/indexnow/state.json";
const manifestFile = "_site/indexnow-manifest.json";
const request = (route) => fetch(`${site.url}${route}`, { signal: AbortSignal.timeout(20000), redirect: "manual" });
if (command === "manifest") {
  const manifest = await createIndexManifest("_site", site.url);
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Fingerprinted ${Object.keys(manifest.pages).length} canonical pages for IndexNow.`);
} else if (command === "prepare") {
  assert.equal(process.env.GITHUB_REF_NAME, "main", "IndexNow preparation requires production main");
  assert.equal(process.env.GITHUB_EVENT_NAME, "push", "IndexNow preparation requires a push deployment");
  if (existsSync(stateFile)) {
    validateState(JSON.parse(await readFile(stateFile, "utf8")), site.url);
  } else {
    // An existing feature manifest means state was lost; silently resetting would lose removals.
    const previousManifest = await request("/indexnow-manifest.json");
    assert.equal(previousManifest.status, 404, "IndexNow state missing after an earlier release; restore the artifact or seed recovery state explicitly");
    const sitemap = await request("/sitemap.xml");
    assert.equal(sitemap.status, 200, "Bootstrap requires the pre-deployment production sitemap");
    const urls = sitemapUrls(await sitemap.text(), site.url);
    await mkdir(".cache/indexnow", { recursive: true });
    await writeFile(stateFile, `${JSON.stringify({ schemaVersion: 1, baseline: Object.fromEntries(urls.map((url) => [url, null])), pending: urls }, null, 2)}\n`);
  }
  console.log("IndexNow baseline preserved before deployment.");
} else if (command === "submit") {
  assert.equal(process.env.GITHUB_REF_NAME, "main", "IndexNow submission requires production main");
  assert.equal(process.env.GITHUB_EVENT_NAME, "push", "IndexNow submission requires a push deployment");
  const state = validateState(JSON.parse(await readFile(stateFile, "utf8")), site.url);
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  // Verify the deployed artifact and public key before notifying any search engine.
  const live = await request("/indexnow-manifest.json");
  assert.equal(live.status, 200);
  assert.deepEqual(await live.json(), manifest, "Production manifest must match the verified artifact");
  const key = await request(`/${config.key}.txt`);
  assert.equal(key.status, 200);
  assert.equal((await key.text()).trim(), config.key);
  try {
    const count = await submitIndexNow({ state, manifest, origin: site.url, ...config });
    console.log(`IndexNow accepted ${count} changed URLs (acceptance does not guarantee indexing).`);
  } finally {
    await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  }
} else throw new Error("Usage: node tools/indexnow.mjs manifest|prepare|submit");
