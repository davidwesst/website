import path from "node:path";
import { readFile } from "node:fs/promises";
import { discoverNewArticles, submittedCrossposts } from "./crosspost-history.js";
import { describeWesternDevsPost } from "./western-devs-post.js";
import { partitionPosts } from "./crosspost-publisher.js";

// Use the publisher's identity rules, including pending articles from older
// releases and target posts removed after submission. No rendered site is needed.
export async function selectUnsubmittedArticles({ root, targetRoot, activationCommit, commit, repository, origin }) {
  const candidates = discoverNewArticles({ root, activationCommit, commit, repository });
  const descriptions = [];
  for (const candidate of candidates) {
    const source = await readFile(path.join(root, candidate.file), "utf8");
    descriptions.push({ ...candidate, ...describeWesternDevsPost({ source, candidate, origin }) });
  }
  return partitionPosts(descriptions, submittedCrossposts(targetRoot));
}
