import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, writeFile, rm, rename } from "node:fs/promises";
import { git } from "../lib/crosspost-history.js";
import { selectUnsubmittedArticles } from "../lib/western-devs-eligibility.js";

async function repository(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "sharing-eligibility-"));
  t.after(async () => {
    assert.ok(path.resolve(root).startsWith(`${path.resolve(os.tmpdir())}${path.sep}`));
    await rm(root, { recursive: true, force: true });
  });
  git(root, ["init", "-b", "main"]);
  git(root, ["config", "user.email", "test@example.invalid"]);
  git(root, ["config", "user.name", "Test"]);
  git(root, ["config", "commit.gpgsign", "false"]);
  git(root, ["config", "core.autocrlf", "false"]);
  return root;
}
async function put(root, file, source = "---\ntitle: Example\ndate: 2026-10-13\n---\nBody\n") {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), source);
}
function commit(root) {
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "Content"]);
  return git(root, ["rev-parse", "HEAD"]).trim();
}
const article = (slug) => `src/content/posts/articles/${slug}/index.md`;
async function fixture(t) {
  const root = await repository(t);
  const targetRoot = await repository(t);
  await put(root, article("historical"));
  const activationCommit = commit(root);
  await put(targetRoot, "README.md", "Community website\n");
  commit(targetRoot);
  const select = () => selectUnsubmittedArticles({ root, targetRoot, activationCommit,
    commit: git(root, ["rev-parse", "HEAD"]).trim(), repository: "owner/site", origin: "https://example.invalid" });
  return { root, targetRoot, select };
}

test("eligibility ignores historical articles, edits and other families but retries older unsubmitted devlogs", async (t) => {
  const { root, select } = await fixture(t);
  await put(root, article("historical"), "Edited historical article\n");
  await put(root, "src/content/posts/gamelogs/game/index.md");
  await put(root, "src/content/talks/talk/index.md");
  commit(root);
  assert.equal((await select()).pending.length, 0);
  await put(root, article("devlog"), "---\ntitle: Devlog\ntopics: [devlog]\n---\nBody\n");
  commit(root);
  const first = await select();
  assert.equal(first.pending.length, 1);
  assert.equal(first.pending[0].file, article("devlog"));
  await put(root, "README.md", "Unrelated later release\n");
  commit(root);
  assert.equal((await select()).pending[0].id, first.pending[0].id);
});

test("acknowledged identities remain excluded after source renames and target removal", async (t) => {
  const { root, targetRoot, select } = await fixture(t);
  await put(root, article("new"));
  commit(root);
  const identity = (await select()).pending[0].id;
  await put(targetRoot, "source/_posts/new.md", `---\ncrosspostId: ${identity}\n---\nBody\n`);
  const submitted = commit(targetRoot);
  await mkdir(path.dirname(path.join(root, article("renamed"))), { recursive: true });
  await rename(path.join(root, article("new")), path.join(root, article("renamed")));
  commit(root);
  await rm(path.join(targetRoot, "source/_posts/new.md"));
  commit(targetRoot);
  const selected = await select();
  assert.equal(selected.pending.length, 0);
  assert.equal(selected.skipped[0].commit, submitted);
});

test("manual target posts acknowledge original URL aliases without a crosspost ID", async (t) => {
  const { root, targetRoot, select } = await fixture(t);
  await put(root, article("new"));
  commit(root);
  const candidate = (await select()).pending[0];
  await put(targetRoot, "source/_posts/manual.md", `---\noriginalurl: ${candidate.aliases.find((url) => url.startsWith("https://www.davidwesst.com"))}\n---\nBody\n`);
  commit(targetRoot);
  assert.equal((await select()).pending.length, 0);
});
