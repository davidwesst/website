import { existsSync, readFileSync } from "node:fs";
const file = ".cache/social-images/manifest.json";
export default function () {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).images : {};
}
