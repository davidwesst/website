const { execFileSync } = require("node:child_process");

// Invoked by actions/github-script; GH_TOKEN authorizes the standard CLI download.
module.exports = async ({ github, context, download = execFileSync }) => {
  const artifacts = await github.paginate(github.rest.actions.listArtifactsForRepo, { ...context.repo, name: "indexnow-state", per_page: 100 });
  const latest = artifacts.filter((artifact) => artifact.workflow_run?.head_branch === "main")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  if (latest?.expired) throw new Error("IndexNow state expired; restore a saved baseline explicitly");
  if (latest) download("gh", ["run", "download", String(latest.workflow_run.id), "--repo", `${context.repo.owner}/${context.repo.repo}`, "--name", "indexnow-state", "--dir", ".cache/indexnow"], { stdio: "inherit" });
};
