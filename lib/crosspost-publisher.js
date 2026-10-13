import assert from "node:assert/strict";

export function assertPublishContext(env, repository) {
  assert.equal(env.GITHUB_ACTIONS, "true", "Publishing requires GitHub Actions");
  assert.equal(env.GITHUB_EVENT_NAME, "push", "Publishing requires a push deployment");
  assert.equal(env.GITHUB_REF_NAME, "main", "Publishing requires production main");
  assert.equal(env.GITHUB_REPOSITORY, repository, "Unexpected source repository");
  assert.equal(env.WESTERN_DEVS_ENABLED, "true", "Crossposting must be explicitly enabled");
}

export function githubClient({ token, repository, fetchImpl = fetch }) {
  assert.ok(token, "A GitHub App installation token is required");
  const base = `https://api.github.com/repos/${repository}`;
  return async (method, route, body) => {
    const response = await fetchImpl(`${base}/${route}`, {
      method, headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30000), redirect: "error",
    });
    if (!response.ok) {
      // Do not print API bodies, which may include submitted article data.
      const error = new Error(`GitHub ${method} ${route} failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  };
}

export function partitionPosts(posts, submitted) {
  const pending = [];
  const skipped = [];
  for (const post of posts) {
    const commit = submitted.ids.get(post.id) || post.aliases.map((url) => submitted.urls.get(url)).find(Boolean);
    if (commit) skipped.push({ id: post.id, title: post.title, commit });
    else pending.push(post);
  }
  return { pending, skipped };
}

// The ref update is the only publication operation. A non-fast-forward update
// never overwrites another contributor; reread and deduplicate before retrying.
export async function publishPosts({ posts, release, branch, request, snapshot, attempts = 3 }) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const state = await snapshot();
    const { pending, skipped } = partitionPosts(posts, state.submitted);
    if (!pending.length) return { published: [], skipped };
    const entries = [];
    const paths = new Set();
    for (const post of pending) {
      for (const file of post.files) {
        assert.ok(!state.paths.has(file.path), `Crosspost destination already exists: ${file.path}`);
        assert.ok(!paths.has(file.path), `Crosspost destination collision: ${file.path}`);
        paths.add(file.path);
        const blob = await request("POST", "git/blobs", { content: file.bytes.toString("base64"), encoding: "base64" });
        entries.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
      }
    }
    const tree = await request("POST", "git/trees", { base_tree: state.tree, tree: entries });
    const commit = await request("POST", "git/commits", {
      message: `feature: crosspost ${pending.length} David Wesst article${pending.length === 1 ? "" : "s"}\n\n- Publish articles from verified source release ${release.commit} (${release.buildId}).\n${pending.map((post) => `- Preserve crosspost identity ${post.id}.`).join("\n")}`,
      tree: tree.sha, parents: [state.commit],
    });
    try {
      await request("PATCH", `git/refs/heads/${branch}`, { sha: commit.sha, force: false });
    } catch (error) {
      // A lost response may follow a successful write. Reconciliation also handles
      // transport failures; permanent permission failures remain fatal.
      if (![409, 422].includes(error.status) && error.status) throw error;
      if (attempt + 1 === attempts) {
        const latest = partitionPosts(posts, (await snapshot()).submitted);
        if (!latest.pending.length) return { published: [], skipped: latest.skipped };
        throw error;
      }
      continue;
    }
    return { published: pending.map((post) => ({ id: post.id, title: post.title, commit: commit.sha })), skipped };
  }
  throw new Error("Crosspost publication retries exhausted");
}

export async function waitForDeployment({ request, commit, workflow, branch, deadlineMs = 600000, now = () => Date.now(), sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), onProgress = () => {} }) {
  const end = now() + deadlineMs;
  let last;
  while (now() < end) {
    const result = await request("GET", `actions/workflows/${encodeURIComponent(workflow)}/runs?head_sha=${commit}&branch=${encodeURIComponent(branch)}&event=push&per_page=100`);
    const runs = result.workflow_runs.filter((run) => run.head_sha === commit && run.event === "push" && run.head_branch === branch).sort((a, b) => b.id - a.id);
    const run = runs[0];
    if (run?.status === "completed") return { commit, url: run.html_url, conclusion: run.conclusion, success: run.conclusion === "success" };
    const progress = run ? `${run.id}: ${run.status}` : "Waiting for target workflow";
    if (progress !== last) { onProgress(progress); last = progress; }
    await sleep(Math.min(15000, Math.max(0, end - now())));
  }
  return { commit, conclusion: "timed_out", success: false };
}
