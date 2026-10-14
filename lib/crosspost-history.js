import { execFileSync } from "node:child_process";
import matter from "gray-matter";

export function git(root, args, options = {}) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 128 * 1024 * 1024, ...options });
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
    const source = lines.join("\n");
    lines = [];
    const header = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    if (!header) return;
    // Some legacy posts have frontmatter accepted by Hexo but rejected by
    // gray-matter. Parse only the identity fields, never unrelated author data.
    const fields = header.match(/^(?:crosspostId|originalurl):[^\n]*(?:\n[ \t]+[^\n]*)*/gm) || [];
    const { data } = matter(`---\n${fields.join("\n")}\n---\n`);
    if (typeof data.crosspostId === "string" && !ids.has(data.crosspostId)) ids.set(data.crosspostId, commit);
    if (typeof data.originalurl === "string" && !urls.has(data.originalurl)) urls.set(data.originalurl, commit);
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
