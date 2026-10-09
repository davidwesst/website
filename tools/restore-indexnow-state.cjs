// Invoked by actions/github-script with its authenticated GitHub client.
module.exports = async ({ github, context, core }) => {
  const artifacts = await github.paginate(github.rest.actions.listArtifactsForRepo, { ...context.repo, name: "indexnow-state", per_page: 100 });
  const latest = artifacts.filter((artifact) => artifact.workflow_run?.head_branch === "main")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  if (latest?.expired) throw new Error("IndexNow state expired; restore a saved baseline explicitly");
  if (latest) core.setOutput("artifact_id", latest.id);
};
