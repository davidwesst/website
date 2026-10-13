import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, writeFile, rename, rm } from "node:fs/promises";
import { git, discoverNewArticles, submittedCrossposts } from "../lib/crosspost-history.js";

async function repository(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "crosspost-history-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  git(root, ["init", "-b", "main"]);
  git(root, ["config", "user.email", "test@example.invalid"]);
  git(root, ["config", "user.name", "Test"]);
  git(root, ["config", "core.autocrlf", "false"]);
  return root;
}
async function put(root, file, value = "---\ntitle: Example\ndate: 2026-10-13\n---\nBody\n") {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), value);
}
function commit(root, message = "Content") {
  git(root, ["add", "."]); git(root, ["commit", "-m", message]);
  return git(root, ["rev-parse", "HEAD"]).trim();
}
const file = (family, slug) => `src/content/${family}/${slug}/index.md`;
const discover = (root, activationCommit) => discoverNewArticles({ root, activationCommit, commit: git(root, ["rev-parse", "HEAD"]).trim(), repository: "owner/site" });

test("only articles introduced after activation qualify, including devlogs", async (t) => {
  const root = await repository(t);
  await put(root, file("posts/articles", "old"));
  const baseline = commit(root);
  assert.deepEqual(discover(root, baseline), []);
  for (const family of ["posts/articles", "posts/gamelogs", "posts/dungeonlogs", "talks", "pages"]) await put(root, file(family, family.replaceAll("/", "-")));
  await put(root, file("posts/articles", "devlog"), "---\ntitle: Devlog\ntopics: [devlog]\n---\nBody\n");
  commit(root);
  assert.deepEqual(discover(root, baseline).map((post) => post.file), [file("posts/articles", "devlog"), file("posts/articles", "posts-articles")]);
});

test("edits, renames and deletion/readdition retain identity and family eligibility", async (t) => {
  const root = await repository(t);
  await put(root, file("posts/articles", "old"));
  await put(root, file("posts/gamelogs", "game"));
  const baseline = commit(root);
  await put(root, file("posts/articles", "new")); commit(root);
  const identity = discover(root, baseline)[0].id;
  for (const [from, to] of [[file("posts/articles", "old"), file("posts/articles", "renamed-old")], [file("posts/articles", "new"), file("posts/articles", "renamed-new")], [file("posts/gamelogs", "game"), file("posts/articles", "game")]]) {
    await mkdir(path.dirname(path.join(root, to)), { recursive: true });
    await rename(path.join(root, from), path.join(root, to));
    commit(root);
  }
  await put(root, file("posts/articles", "renamed-new"), "Edited article"); commit(root);
  assert.deepEqual(discover(root, baseline).map((post) => post.id), [identity]);
  await rm(path.join(root, file("posts/articles", "renamed-new"))); commit(root);
  assert.deepEqual(discover(root, baseline), []);
  await put(root, file("posts/articles", "renamed-new")); commit(root);
  assert.equal(discover(root, baseline)[0].id, identity);
});

test("merged articles qualify and unmerged branch additions do not", async (t) => {
  const root = await repository(t);
  await put(root, "README.md", "Site"); const baseline = commit(root);
  git(root, ["switch", "-c", "article"]);
  await put(root, file("posts/articles", "merged")); commit(root);
  git(root, ["switch", "main"]);
  assert.deepEqual(discover(root, baseline), []);
  git(root, ["merge", "--no-ff", "article", "-m", "Merge article"]);
  assert.equal(discover(root, baseline).length, 1);
  assert.throws(() => discoverNewArticles({ root, activationCommit: "a".repeat(40), commit: git(root, ["rev-parse", "HEAD"]).trim(), repository: "owner/site" }), /first-parent/);
});

test("target history remembers removed posts, aliases and their submitting commits", async (t) => {
  const root = await repository(t);
  await put(root, "source/_posts/post.md", '---\ncrosspostId: abc\noriginalurl: "https://example.invalid/blog/a/"\n---\nBody');
  const submitted = commit(root);
  await rm(path.join(root, "source/_posts/post.md")); commit(root);
  const history = submittedCrossposts(root);
  assert.equal(history.ids.get("abc"), submitted);
  assert.equal(history.urls.get("https://example.invalid/blog/a/"), submitted);
});

test("rewritten reclassifications use slugs and renamed articles use redirect aliases", async (t) => {
  const root = await repository(t);
  await put(root, file("posts/gamelogs", "game"), "Completely unrelated old game text");
  await put(root, file("posts/articles", "old"), "Completely unrelated old article text");
  const baseline = commit(root);
  await rm(path.join(root, file("posts/gamelogs", "game")));
  await put(root, file("posts/articles", "game"), "---\ntitle: Reclassified\n---\nNew content entirely");
  commit(root);
  await rm(path.join(root, file("posts/articles", "old")));
  await put(root, file("posts/articles", "renamed"), "---\ntitle: Renamed\nredirectFrom: [/blog/old/]\n---\nBrand new text");
  commit(root);
  assert.deepEqual(discover(root, baseline), []);
});

test("frontmatter-looking code examples never acknowledge an unpublished article", async (t) => {
  const root = await repository(t);
  await put(root, "source/_posts/example.md", "---\ntitle: Example\n---\n```yaml\ncrosspostId: fake\noriginalurl: https://fake.invalid/\n```\n");
  commit(root);
  const history = submittedCrossposts(root);
  assert.equal(history.ids.size, 0);
  assert.equal(history.urls.size, 0);
});
