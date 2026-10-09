import assert from "node:assert/strict";
import test from "node:test";
import restoreState from "../tools/restore-indexnow-state.cjs";

const artifact = (id, runId, created, branch = "main", expired = false) => ({ id, created_at: created, expired, workflow_run: { id: runId, head_branch: branch } });
function options(artifacts, download) {
  return { github: { rest: { actions: { listArtifactsForRepo: () => {} } }, paginate: async (_, query) => { assert.equal(query.name, "indexnow-state"); return artifacts; } }, context: { runId: 999, repo: { owner: "davidwesst", repo: "website" } }, download };
}

test("restore downloads the latest main state from its owning run, not the current run or artifact ID", async () => {
  const artifacts = [artifact(10, 100, "2026-10-08"), artifact(20, 200, "2026-10-09"), artifact(30, 300, "2026-10-10", "feature")];
  let calls = 0;
  await restoreState(options(artifacts, (command, args, settings) => {
    calls++;
    assert.equal(command, "gh");
    assert.deepEqual(args, ["run", "download", "200", "--repo", "davidwesst/website", "--name", "indexnow-state", "--dir", ".cache/indexnow"]);
    assert.equal(settings.stdio, "inherit");
  }));
  assert.equal(calls, 1);
});

test("no prior state leaves bootstrap to the existing preparation command", async () => {
  await restoreState(options([], () => assert.fail("Nothing to download")));
});

test("expired state and download failure remain visible and never fall back to an older queue", async () => {
  await assert.rejects(restoreState(options([artifact(10, 100, "2026-10-08"), artifact(20, 200, "2026-10-09", "main", true)], () => assert.fail("Expired state must not download"))), /expired/);
  await assert.rejects(restoreState(options([artifact(20, 200, "2026-10-09")], () => { throw new Error("Download failed"); })), /Download failed/);
});
