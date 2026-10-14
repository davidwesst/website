import assert from "node:assert/strict";
import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { sharingDestination } from "./sharing-config.js";
import { targetSnapshot } from "./sharing-target.js";
import { readDeployment } from "./deployment-identity.js";
import { convertWesternDevsPost, describeWesternDevsPost } from "./western-devs-post.js";
import { githubClient, partitionPosts, publishPosts, waitForDeployment } from "./crosspost-publisher.js";

const adapters = { "western-devs": { describe: describeWesternDevsPost, convert: convertWesternDevsPost } };

async function articleCandidate(root, slug, repository) {
  assert.match(slug || "", /^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use an article slug, such as devlog0011, without a URL or path");
  const file = `src/content/posts/articles/${slug}/index.md`;
  if (!existsSync(path.join(root, file))) {
    const otherFamilies = ["posts/gamelogs", "posts/dungeonlogs", "talks", "pages"];
    assert.ok(!otherFamilies.some((family) => existsSync(path.join(root, "src/content", family, slug, "index.md"))), `Only articles can be shared: ${slug} belongs to another content family`);
    throw new Error(`Article not found: ${slug}`);
  }
  // Manual selection has no activation cutoff or source-history dependency.
  // Canonical/redirect aliases also acknowledge earlier automated crossposts.
  return { file, originalPath: file, id: createHash("sha256").update(`${repository}\n${file}`).digest("hex") };
}

async function builtArticle(root, siteRoot, candidate, canonical) {
  const message = "Run pnpm build before sharing, and rebuild after editing the article or its assets";
  const page = path.join(siteRoot, new URL(canonical).pathname, "index.html");
  assert.ok(existsSync(page) && existsSync(path.join(siteRoot, "deployment.json")), message);
  const built = await stat(page);
  async function check(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await check(file);
      else if (entry.isFile()) assert.ok((await stat(file)).mtimeMs <= built.mtimeMs, message);
    }
  }
  await check(path.dirname(path.join(root, candidate.file)));
  return readDeployment(path.join(siteRoot, "deployment.json"), null);
}

// A manual invocation selects exactly one article. Preparing a preview performs
// no network requests; external writes require the caller's publish option.
export async function shareArticle(slug, destinationKey, {
  root = process.cwd(), origin, publish = false, wait = false, env = process.env,
  request: suppliedRequest, snapshot: suppliedSnapshot, onProgress = () => {},
} = {}) {
  assert.ok(!wait || publish, "--wait requires --publish");
  const { sourceRepository, destination } = await sharingDestination(root, destinationKey);
  assert.ok(Object.hasOwn(adapters, destination.adapter), `Unsupported sharing adapter: ${destination.adapter}`);
  const adapter = adapters[destination.adapter];
  const candidate = await articleCandidate(root, slug, sourceRepository);
  const description = adapter.describe({ source: await readFile(path.join(root, candidate.file), "utf8"), candidate, origin });
  const previewRoot = path.join(root, ".cache/sharing", destinationKey, slug, randomUUID());
  const reportPath = path.join(previewRoot, "report.json");
  const report = { mode: publish ? "publish" : "preview", slug, destination: destinationKey,
    repository: destination.repository, branch: destination.branch, canonical: description.canonical,
    status: "preparing", files: [], published: [], skipped: [], deployments: [], failures: [] };
  let failure;
  try {
    let request, snapshot;
    if (publish) {
      assert.ok(typeof env[destination.tokenEnv] === "string" && env[destination.tokenEnv].trim(), `Set ${destination.tokenEnv} to a GitHub personal access token before using --publish`);
      request = suppliedRequest || githubClient({ token: env[destination.tokenEnv], tokenEnv: destination.tokenEnv, repository: destination.repository });
      snapshot = suppliedSnapshot || targetSnapshot({ root, destination });
      report.skipped = partitionPosts([description], (await snapshot()).submitted).skipped;
    }
    if (!report.skipped.length) {
      const siteRoot = path.join(root, "_site");
      const release = await builtArticle(root, siteRoot, candidate, description.canonical);
      report.sourceBuild = release;
      const post = await adapter.convert({ root, siteRoot, origin, candidate, release, authorId: destination.authorId });
      for (const file of post.files) {
        const output = path.resolve(previewRoot, file.path);
        assert.ok(output.startsWith(`${path.resolve(previewRoot)}${path.sep}`), "Preview file must remain inside its output directory");
        await mkdir(path.dirname(output), { recursive: true });
        await writeFile(output, file.bytes);
        report.files.push({ path: file.path, bytes: file.bytes.length });
      }
      if (publish) {
        const result = await publishPosts({ posts: [post], release, branch: destination.branch, request, snapshot });
        report.published = result.published;
        report.skipped = result.skipped;
      }
    }
    report.status = publish ? (report.published.length ? "published" : "already_shared") : "prepared";
    if (wait) {
      const commit = [...report.published, ...report.skipped][0].commit;
      const deployment = await waitForDeployment({ request, commit, workflow: destination.workflow, branch: destination.branch, onProgress });
      report.deployments.push(deployment);
      assert.ok(deployment.success, "Target deployment failed or timed out. The article is already submitted; retry the existing target workflow run");
    }
  } catch (error) {
    report.status = "failed";
    report.failures.push({ message: error.message });
    failure = error;
  } finally {
    await mkdir(previewRoot, { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  if (failure) { failure.reportPath = reportPath; throw failure; }
  return { ...report, previewRoot, reportPath, destinationName: destination.name };
}
