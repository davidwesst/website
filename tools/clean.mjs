import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const projectDirectory = resolve(".");
const outputDirectory = resolve("_site");

if (dirname(outputDirectory) !== projectDirectory) {
  throw new Error(`Refusing to clean unexpected path: ${outputDirectory}`);
}

await rm(outputDirectory, { recursive: true, force: true });
