import assert from "node:assert/strict";
import test from "node:test";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import matter from "gray-matter";
import { load } from "cheerio";
import { convertWesternDevsPost } from "../lib/western-devs-post.js";

const origin = "https://david.wes.st";
const candidate = { file: "src/content/posts/articles/example/index.md", originalPath: "src/content/posts/articles/example/index.md", id: "abc" };
const release = { commit: "a".repeat(40), buildId: "github-1-1" };
async function fixture(t, { fields = "topics: [devlog, C#]\nsummary: Full summary\nbanner: {src: ./image.png, alt: Banner, credit: Artist}", body = '<p>Text <a href="../other/#section">other</a><a href="#heading">here</a></p><picture><source srcset="/assets/responsive/a.webp 320w"><img src="./image.png" alt="Original"></picture><pre><code>{{ value }} {% endraw %}</code></pre><iframe src="https://www.youtube.com/embed/a"></iframe>', date = "2026-10-13" } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "western-devs-post-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.dirname(path.join(root, candidate.file)), { recursive: true });
  await writeFile(path.join(root, candidate.file), `---\ntitle: 'Unicode café: example'\ndate: ${date}\n${fields}\n---\nBody\n`);
  const siteRoot = path.join(root, "_site");
  await mkdir(path.join(siteRoot, "blog/example"), { recursive: true });
  await writeFile(path.join(siteRoot, "blog/example/image.png"), Buffer.from([1, 2, 3]));
  await writeFile(path.join(siteRoot, "blog/example/index.html"), `<html><head><link rel="canonical" href="${origin}/blog/example/"><meta name="description" content="Normalized description"></head><body><article><h1>Heading</h1><figure class="post-visual"><img src="./image.png" alt="Banner"><figcaption>Artist</figcaption></figure><section aria-label="Post content">${body}</section><aside>Navigation</aside></article><script>analytics()</script></body></html>`);
  return { root, siteRoot, origin, candidate, release };
}

test("maps metadata and full article HTML, copies original bytes, and excludes site chrome", async (t) => {
  const post = await convertWesternDevsPost(await fixture(t));
  const markdown = post.files[0].bytes.toString();
  const parsed = matter(markdown);
  assert.equal(parsed.data.title, "Unicode café: example");
  assert.equal(parsed.data.date, "2026-10-13T12:00:00");
  assert.equal(parsed.data.updated, parsed.data.date);
  assert.equal(parsed.data.authorId, "david_wesst");
  assert.deepEqual(parsed.data.tags, ["devlog", "C#"]);
  assert.deepEqual(parsed.data.categories, ["devlog"]);
  assert.equal(parsed.data.excerpt, "Full summary");
  assert.equal(parsed.data.description, "Normalized description");
  assert.equal(parsed.data.originalurl, `${origin}/blog/example/`);
  assert.equal(post.files.length, 2);
  assert.deepEqual(post.files[1].bytes, Buffer.from([1, 2, 3]));
  assert.match(markdown, /Artist/);
  assert.match(markdown, /https:\/\/david.wes.st\/blog\/other\/#section/);
  assert.match(markdown, /href="#heading"/);
  assert.match(markdown, /https:\/\/www.youtube.com\/embed\/a/);
  assert.doesNotMatch(markdown, /analytics|Navigation|srcset|picture|class=/);
  const body = load(parsed.content.replace("{% raw %}", "").replace("{% endraw %}", ""), {}, false);
  assert.equal(body("code").text(), "{{ value }} {% endraw %}");
});

test("uses description fallback and default category when summary/topics are absent", async (t) => {
  const parsed = matter((await convertWesternDevsPost(await fixture(t, { fields: "" }))).files[0].bytes.toString());
  assert.equal(parsed.data.excerpt, "Normalized description");
  assert.deepEqual(parsed.data.tags, []);
  assert.equal(parsed.data.categories, undefined);
});

test("preserves explicit date offsets and update dates", async (t) => {
  const parsed = matter((await convertWesternDevsPost(await fixture(t, { date: "'2026-10-13T01:00:00+09:00'", fields: "updated: 2026-10-14" }))).files[0].bytes.toString());
  assert.equal(parsed.data.date, "2026-10-13T01:00:00+09:00");
  assert.equal(parsed.data.updated, "2026-10-14T12:00:00");
});

test("refuses missing images, unsupported executable embeds and inconsistent canonicals", async (t) => {
  await assert.rejects(convertWesternDevsPost(await fixture(t, { body: '<img src="./missing.png" alt="Missing">' })), /ENOENT/);
  await assert.rejects(convertWesternDevsPost(await fixture(t, { body: "<script>embed()</script>" })), /manual crossposting/);
  const options = await fixture(t);
  await writeFile(path.join(options.siteRoot, "blog/example/index.html"), '<link rel="canonical" href="https://elsewhere.invalid/">');
  await assert.rejects(convertWesternDevsPost(options), /canonical/);
});
