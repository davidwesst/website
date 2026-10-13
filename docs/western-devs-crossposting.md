# Western Devs crossposting

## Behavior

The `western-devs` job in CI/CD publishes new articles after a verified production push to `main`. Devlogs qualify because they are articles. Gamelogs, dungeonlogs, talks, pages, edits, and pre-activation content do not qualify. Source `main` and target `master` are intentionally different branches.

The activation boundary is the full commit recorded in `config/western-devs.json`. It is immutable once enabled. Every eligible article still present in a release is reconsidered until target Git history acknowledges its identity or original URL. This supports deployment gaps, failed submissions, reruns, and target posts subsequently removed by an editor. No separate expiring artifact owns the publication ledger.

The converter takes full text from the verified release's authored HTML body, retaining its Markdown-rendered code, tables, links, and embeds. The resulting `.md` post contains HTML protected from Hexo's template processing. This avoids duplicating Eleventy's Markdown renderer. Source navigation, sharing controls, styling classes, responsive derivatives, and telemetry are omitted. Script/style embeds and unsupported responsive media stop conversion for manual handling.

Metadata uses the existing target format: `authorId: david_wesst`, original title/date, all topics as tags, first topic as category, summary as excerpt, normalized description, and canonical source URL as `originalurl`. Date-only values use noon in the target's configured timezone to retain their calendar date. Explicit timestamp offsets remain intact. Changing topic order after crossposting does not change the target category or URL.

Article-owned image bytes are copied into `source/images/david-wesst/`, with content hashes preventing collisions. Other assets and links refer to absolute source URLs. Banners retain alt text and credit. Western Devs already uses `originalurl` for visible attribution and canonical links; its standard meta description is hard-coded and cannot be made article-specific without a template change.

## One-time setup and enablement

1. Register a GitHub App with repository **Contents: read/write** and **Actions: read**. Metadata read is implicit. Install it on `westerndevs/western-devs-website` only.
2. Confirm repository rules allow that app to update `master` directly. Do not weaken branch rules or replace direct publication with PR creation silently.
3. In `davidwesst/website`, set the configuration variable `WESTERN_DEVS_APP_CLIENT_ID` to the app client ID. Set the secret `WESTERN_DEVS_APP_PRIVATE_KEY` to its complete PEM private key. The pinned token action mints a repository-scoped installation token and revokes it after the job.
4. Leave `WESTERN_DEVS_ENABLED` unset or `false` while reviewing conversion and validating the target build. The feature is disabled by default and missing credentials are never treated as success when enabled.
5. Verify the activation commit, run `pnpm crosspost:western-devs plan` against a built artifact whose identity matches the checkout, and inspect `.cache/western-devs/report.json`. The unchanged activation release must produce zero eligible articles. Existing article conversion is covered by fixtures; it is not historical publication eligibility.
6. Set `WESTERN_DEVS_ENABLED=true` when setup is complete. The next successful `main` push deployment runs the publisher. Articles added after the activation boundary, including while the integration was disabled, qualify; choose the enablement timing accordingly.

No target templates, configuration, or deployment workflow are modified. The target's existing push workflow publishes the submitted commit.

## Validation

Run `pnpm build` and `pnpm test`, including main and non-main build modes. Focused tests cover source Git history, metadata/body conversion, duplicate identities/URLs, removed target posts, atomic commits, concurrent target updates, lost responses, and target deployment outcomes. Use a disposable target checkout to run its existing Hexo build against generated fixture posts. Inspect author, excerpt, category, tags, canonical attribution, code, images, and embeds.

During implementation on 2026-10-13, the unchanged target build accepted two existing-article fixtures and a synthetic code/table/iframe fixture. Inspection confirmed the source canonical, summary, table, iframe, and literal `{{ value }}` / `{% endraw %}` code survived. These were disposable local fixtures, not published posts.

`pnpm crosspost:western-devs plan` writes previews under `.cache/western-devs/preview` and never writes to GitHub. `publish` is restricted to enabled GitHub Actions push runs on source `main` and invokes the established canonical release verifier before submission. It uses the downloaded site artifact rather than rebuilding.

## Results and recovery

The job summary and `western-devs-report` artifact distinguish submitted posts, previously submitted posts, target deployments, and failures. The report includes source commit/build identity and target commit/run links. Conversion failure submits nothing in that batch. A target path collision stops publication rather than overwriting it.

Ref updates are non-forced. The publisher retries at most three times after reconciling the current target history. A lost response after a successful write is recognized as an acknowledged submission. A later successful source deployment or failed-job rerun retries articles not acknowledged by the target; target edits and deletions are never synchronized.

Target workflow discovery and completion are bounded to ten minutes per submitted commit. Failed or timed-out target deployment fails crossposting without rolling back the source site. Retry the existing Western Devs workflow run; source-job reruns inspect that same commit and do not create another article. A permanently removed crosspost remains acknowledged in target history.

Disable future publication by setting `WESTERN_DEVS_ENABLED=false`. Historical source/target Git history is required; a missing activation boundary fails explicitly rather than resetting eligibility. Do not rewrite either history or change the activation boundary to recover a transient failure.

Retain `redirectFrom` when renaming and heavily rewriting a document. Git rename detection, unchanged slugs, and redirects preserve content identity across family moves. An addition combined with an unrecognizable document deletion fails as ambiguous; separate new additions from unrelated deletions before merging. Already acknowledged articles are skipped before conversion, so later edits cannot require another target conversion or publish an update.
