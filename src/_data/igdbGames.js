import { IGDB_CACHE_SCHEMA_VERSION, hasCachedImages, readIgdbManifest } from "../../lib/igdb.js";

export default function () {
  const manifest = readIgdbManifest();
  return manifest?.schemaVersion === IGDB_CACHE_SCHEMA_VERSION && hasCachedImages(manifest) ? manifest.games || {} : {};
}
