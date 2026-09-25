import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import matter from "gray-matter";
import { createGamelog } from "../tools/new-content.mjs";

const TEMPLATE = path.resolve("templates", "gamelog", "index.md");

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "website-new-content-"));
  for (const type of ["articles", "gamelogs", "dungeonlogs"]) {
    await mkdir(path.join(root, "src", "content", "posts", type), { recursive: true });
  }
  return root;
}

test("createGamelog creates a templated post in the normalized gamelog directory", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const result = await createGamelog("The Example Game", {
    root,
    template: TEMPLATE,
    date: new Date("2026-09-24T12:00:00Z"),
  });
  const source = await readFile(result.destination, "utf8");
  const parsed = matter(source);

  assert.equal(result.destination, path.join(root, "src", "content", "posts", "gamelogs", "the-example-game", "index.md"));
  assert.equal(parsed.data.title, "The Example Game");
  assert.equal(parsed.data.date.toISOString(), "2026-09-24T00:00:00.000Z");
  assert.deepEqual(parsed.data.redirectFrom, ["/blog/gamelog/the-example-game/"]);
  assert.equal(parsed.data.customData.game.ids.igdb, 0);
  assert.match(parsed.content, /Write the gamelog here/);
  assert.doesNotMatch(source, /{{[^}]+}}/);
});

test("createGamelog refuses reserved and globally duplicated post slugs", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const article = path.join(root, "src", "content", "posts", "articles", "existing-post");
  await mkdir(article);
  await writeFile(path.join(article, "index.md"), "---\ntitle: Existing\n---\n");

  await assert.rejects(
    createGamelog("Existing Post", { root, template: TEMPLATE }),
    /already exists in articles/,
  );
  await assert.rejects(
    createGamelog("gamelogs", { root, template: TEMPLATE }),
    /reserved for a blog index/,
  );
});
