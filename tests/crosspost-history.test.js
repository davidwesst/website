import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { git, submittedCrossposts } from "../lib/crosspost-history.js";

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

test("target history remembers removed posts, aliases and their submitting commits", async (t) => {
  const root = await repository(t);
  await put(root, "source/_posts/post.md", '---\ncrosspostId: abc\noriginalurl: "https://example.invalid/blog/a/"\n---\nBody');
  const submitted = commit(root);
  await rm(path.join(root, "source/_posts/post.md")); commit(root);
  const history = submittedCrossposts(root);
  assert.equal(history.ids.get("abc"), submitted);
  assert.equal(history.urls.get("https://example.invalid/blog/a/"), submitted);
});

test("frontmatter-looking code examples never acknowledge an unpublished article", async (t) => {
  const root = await repository(t);
  await put(root, "source/_posts/example.md", "---\ntitle: Example\n---\n```yaml\ncrosspostId: fake\noriginalurl: https://fake.invalid/\n```\n");
  commit(root);
  const history = submittedCrossposts(root);
  assert.equal(history.ids.size, 0);
  assert.equal(history.urls.size, 0);
});

test("permissive legacy frontmatter does not prevent reading unrelated identity fields", async (t) => {
  const root = await repository(t);
  await put(root, "source/_posts/legacy.md", "---\ntitle: Legacy\n!/bin/bash\noriginalurl: https://legacy.invalid/article/\n---\nBody");
  const submitted = commit(root);
  assert.equal(submittedCrossposts(root).urls.get("https://legacy.invalid/article/"), submitted);
});
