import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { copyFile, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import matter from "gray-matter";
import { createArticle, createGamelog } from "../tools/new-content.mjs";

const TEMPLATE = path.resolve("templates", "gamelog", "index.md");
const ARTICLE_TEMPLATE = path.resolve("templates", "article", "index.md");
const CLI = path.resolve("tools", "new-content.mjs");
const runFile = promisify(execFile);
const CREATORS = [
  { type: "article", create: createArticle, template: ARTICLE_TEMPLATE },
  { type: "gamelog", create: createGamelog, template: TEMPLATE },
];

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "website-new-content-"));
  for (const type of ["articles", "gamelogs", "dungeonlogs"]) {
    await mkdir(path.join(root, "src", "content", "posts", type), { recursive: true });
  }
  for (const { type, template } of CREATORS) {
    const directory = path.join(root, "templates", type);
    await mkdir(directory, { recursive: true });
    await copyFile(template, path.join(directory, "index.md"));
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

test("createArticle creates metadata based on recent articles and leaves the banner optional", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const result = await createArticle('  my_next-article: "hello"  ', {
    root,
    date: new Date("2026-09-24T23:30:00-05:00"),
  });
  const source = await readFile(result.destination, "utf8");
  const parsed = matter(source);

  assert.equal(result.slug, "my-next-article-hello");
  assert.equal(result.destination, path.join(root, "src", "content", "posts", "articles", result.slug, "index.md"));
  assert.deepEqual(parsed.data, {
    title: 'My Next Article: "Hello"',
    date: new Date("2026-09-25T00:00:00Z"),
    summary: "",
    topics: [],
  });
  assert.match(source, /#   src: \.\/my-next-article-hello_banner\.jpg/);
  assert.match(parsed.content, /Write the article here/);
  assert.doesNotMatch(source, /{{[^}]+}}/);
});

for (const { type, create } of CREATORS) {
  test(`${type} creation refuses reserved and globally duplicated slugs without overwriting files`, async (t) => {
    const root = await fixture();
    t.after(() => rm(root, { recursive: true, force: true }));
    for (const family of ["articles", "gamelogs", "dungeonlogs"]) {
      await assert.rejects(create(family, { root }), /reserved for a blog index/);
      const directory = path.join(root, "src", "content", "posts", family, `existing-${family}`);
      await mkdir(directory);
      const destination = path.join(directory, "index.md");
      const original = "---\ntitle: Existing\n---\nOriginal article body.\n";
      await writeFile(destination, original);
      await assert.rejects(create(`Existing ${family}`, { root }), new RegExp(`already exists in ${family}`));
      assert.equal(await readFile(destination, "utf8"), original);
    }
  });

  test(`${type} creation validates names, dates, and missing templates before creating files`, async (t) => {
    const root = await fixture();
    t.after(() => rm(root, { recursive: true, force: true }));
    for (const name of [undefined, "", "   "]) {
      await assert.rejects(create(name, { root }), /name is required/);
    }
    await assert.rejects(create("!!!", { root }), /does not produce a valid URL slug/);
    for (const date of [new Date("invalid"), "2026-09-24"]) {
      await assert.rejects(create("Invalid Date", { root, date }), /date is invalid/);
    }
    await assert.rejects(create("Missing Template", { root, template: path.join(root, "missing.md") }), /template not found/);
    for (const family of ["articles", "gamelogs", "dungeonlogs"]) {
      assert.deepEqual(await readdir(path.join(root, "src", "content", "posts", family)), []);
    }
  });

  test(`${type} CLI accepts quoted names and multiple name words`, async (t) => {
    const root = await fixture();
    t.after(() => rm(root, { recursive: true, force: true }));
    for (const nameParts of [["Quoted Example"], ["Multiple", "Name", "Words"]]) {
      const { stdout, stderr } = await runFile(process.execPath, [CLI, type, ...nameParts], { cwd: root });
      const slug = nameParts.join(" ").toLowerCase().replaceAll(" ", "-");
      const relative = path.join("src", "content", "posts", `${type}s`, slug, "index.md");
      assert.equal(stdout.trim(), `Created ${relative}`);
      assert.equal(stderr, "");
      const parsed = matter(await readFile(path.join(root, relative), "utf8"));
      assert.equal(parsed.data.title, nameParts.join(" "));
      assert.equal(Number.isNaN(parsed.data.date.valueOf()), false);
    }
  });
}

test("CLI rejects unsupported types and missing names with usage guidance", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const args of [[], ["article"], ["gamelog"], ["dungeonlog", "Example"], ["toString", "Example"]]) {
    await assert.rejects(runFile(process.execPath, [CLI, ...args], { cwd: root }), (error) => {
      assert.equal(error.code, 1);
      assert.equal(error.stdout, "");
      assert.match(error.stderr, /Usage: pnpm run new <article\|gamelog> <name>/);
      return true;
    });
  }
});
