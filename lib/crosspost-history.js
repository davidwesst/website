import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";

export function git(root, args, options = {}) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 128 * 1024 * 1024, ...options });
}

const document = (file) => /^src\/content\/(?:posts\/(?:articles|gamelogs|dungeonlogs)|talks|pages)\/[^/]+\/index\.md$/.test(file);
const article = (file) => /^src\/content\/posts\/articles\/[^/]+\/index\.md$/.test(file);

// Replay main's snapshots, rather than counting additions on unmerged branches.
// Tombstones keep a deletion/readdition from creating a second identity.
export function discoverNewArticles({ root, activationCommit, commit, repository }) {
  assert.match(activationCommit || "", /^[a-f0-9]{40}$/, "A full activation commit is required");
  assert.match(commit || "", /^[a-f0-9]{40}$/, "A full release commit is required");
  const commits = git(root, ["rev-list", "--first-parent", "--reverse", commit]).trim().split("\n");
  assert.ok(commits.includes(activationCommit), "Activation must be on the release's first-parent history");
  const current = new Map();
  const remembered = new Map();
  let active = false;
  let previous;
  for (const sha of commits) {
    const changes = git(root, ["diff-tree", "--root", "--no-commit-id", "-r", "--name-status", "-z", "--find-renames=40%", ...(previous ? [previous, sha] : [sha]), "--", "src/content"]).split("\0");
    const entries = [];
    for (let i = 0; i < changes.length - 1;) {
      const status = changes[i++];
      const file = changes[i++];
      entries.push({ status, file, destination: status.startsWith("R") ? changes[i++] : undefined });
    }
    const deleted = entries.filter(({ status, file }) => status === "D" && current.has(file));
    const aliasesFor = (file) => {
      const data = matter(git(root, ["show", `${sha}:${file}`])).data;
      return new Set((data.redirectFrom || []).map((url) => new URL(url, "https://source.invalid").pathname.split("/").filter(Boolean).filter((part) => part !== "index.html").at(-1)));
    };
    const add = (file) => {
      if (!document(file)) return;
      let identity = remembered.get(file);
      if (!identity && active && article(file)) {
        const slug = file.split("/").at(-2);
        const aliases = aliasesFor(file);
        const matches = deleted.filter((entry) => entry.file.split("/").at(-2) === slug || aliases.has(entry.file.split("/").at(-2)));
        assert.ok(matches.length <= 1, `Ambiguous content move: ${file}`);
        if (matches.length) identity = remembered.get(matches[0].file);
        else assert.equal(deleted.length, 0, `Cannot distinguish a new article from a rewritten move: ${file}. Preserve redirectFrom or separate the addition from content deletions.`);
      }
      identity ||= {
        eligible: active && article(file), introductionCommit: sha, originalPath: file,
        id: createHash("sha256").update(`${repository}\n${file}\n${sha}`).digest("hex"),
      };
      remembered.set(file, identity);
      current.set(file, identity);
    };
    for (const { status, file, destination } of entries) {
      if (status.startsWith("R")) {
        const identity = current.get(file) || remembered.get(file);
        if (identity) {
          current.delete(file);
          remembered.set(destination, identity);
          if (document(destination)) current.set(destination, identity);
        } else add(destination);
      } else if (status === "D") {
        current.delete(file);
      } else if (status === "A") add(file);
    }
    if (sha === activationCommit) active = true;
    previous = sha;
  }
  return [...current].filter(([file, identity]) => article(file) && identity.eligible)
    .map(([file, identity]) => ({ file, ...identity })).sort((a, b) => a.file.localeCompare(b.file));
}

export function submittedCrossposts(root, ref = "HEAD") {
  const ids = new Map();
  const urls = new Map();
  // Whole-file context distinguishes real frontmatter from code examples.
  // Deleted posts remain acknowledged by their earlier versions.
  const history = git(root, ["log", ref, "--format=@@%H", "-p", "--unified=1000000", "--no-ext-diff", "--", "source/_posts"]);
  let commit;
  let lines = [];
  let hunk = false;
  const remember = () => {
    if (!lines.length) return;
    const { data } = matter(lines.join("\n"));
    if (typeof data.crosspostId === "string" && !ids.has(data.crosspostId)) ids.set(data.crosspostId, commit);
    if (typeof data.originalurl === "string" && !urls.has(data.originalurl)) urls.set(data.originalurl, commit);
    lines = [];
  };
  for (const line of history.split("\n")) {
    if (/^@@[a-f0-9]{40}$/.test(line)) { remember(); commit = line.slice(2); hunk = false; }
    else if (line.startsWith("diff --git ")) { remember(); hunk = false; }
    else if (/^@@ .* @@/.test(line)) hunk = true;
    else if (hunk && (line.startsWith("+") || line.startsWith(" "))) lines.push(line.slice(1));
  }
  remember();
  return { ids, urls };
}
