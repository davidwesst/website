import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";

const outputDirectory = join(process.cwd(), "_site");

async function findHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? findHtmlFiles(path) : [path];
    }),
  );

  return files.flat().filter((path) => path.endsWith(".html"));
}

test("the build contains only the home page", async () => {
  const htmlFiles = (await findHtmlFiles(outputDirectory)).map((path) =>
    relative(outputDirectory, path).replaceAll("\\", "/"),
  );

  assert.deepEqual(htmlFiles, ["index.html"]);

  const homePage = await readFile(join(outputDirectory, "index.html"), "utf8");
  assert.match(homePage, /<h1[^>]*>David Wesst<\/h1>/);
  assert.match(homePage, /\/assets\/main\.css/);
  assert.match(homePage, /bg-black/);
  assert.match(homePage, /text-white/);
  assert.doesNotMatch(homePage, /slate-/);
});
