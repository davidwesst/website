# Western Devs crossposting

## Behavior

The `western-devs` destination job in the standalone **article-sharing** workflow publishes new articles after a verified production push to `main`. `.github/workflows/article-sharing.yml` listens for CI/CD completion through `workflow_run`. Its read-only source-release gate verifies that the originating run is a completed `main` push from this repository and that its build and a production deployment succeeded. An IndexNow failure does not prevent sharing after a healthy deployment. Devlogs qualify because they are articles. Gamelogs, dungeonlogs, talks, pages, edits, and pre-activation content do not qualify. Source `main` and target `master` are intentionally different branches.

Article sharing has an independent workflow result and can be rerun without rebuilding or republishing the source site. A shared release gate provides the original commit, run ID, and artifact ID to destination jobs, so additional destinations can be added as independent jobs. CI/CD does not depend on sharing and contains no sharing job.

The source gate queries all attempts of the publishing run and uses the newest result of each job, retaining successful build/deploy jobs when only failed jobs were rerun. The source job names and workflow path are checked by `lib/article-sharing.js`; keep those selectors aligned with CI/CD when renaming its build/deploy jobs. Missing, expired, ambiguous, or mismatched site artifacts fail explicitly.

The activation boundary is the full commit recorded in `config/western-devs.json`. It is immutable once enabled. Every eligible article still present in a release is reconsidered until target Git history acknowledges its identity or original URL. This supports deployment gaps, failed submissions, reruns, and target posts subsequently removed by an editor. No separate expiring artifact owns the publication ledger.

The converter takes full text from the verified release's authored HTML body, retaining its Markdown-rendered code, tables, links, and embeds. The resulting `.md` post contains HTML protected from Hexo's template processing. This avoids duplicating Eleventy's Markdown renderer. Source navigation, sharing controls, styling classes, responsive derivatives, and telemetry are omitted. Script/style embeds and unsupported responsive media stop conversion for manual handling.

Metadata uses the existing target format: `authorId: david_wesst`, original title/date, all topics as tags, first topic as category, summary as excerpt, normalized description, and canonical source URL as `originalurl`. Date-only values use noon in the target's configured timezone to retain their calendar date. Explicit timestamp offsets remain intact. Changing topic order after crossposting does not change the target category or URL.

Article-owned image bytes are copied into `source/images/david-wesst/`, with content hashes preventing collisions. Other assets and links refer to absolute source URLs. Banners retain alt text and credit. Western Devs already uses `originalurl` for visible attribution and canonical links; its standard meta description is hard-coded and cannot be made article-specific without a template change.

## One-time setup and enablement

1. Create a personal access token from your GitHub account. Prefer a fine-grained token with resource owner **westerndevs**, repository access limited to **western-devs-website**, **Contents: read/write**, and **Actions: read**. Metadata read is implicit. Complete any organization approval required for the token. These permissions allow article commits and target workflow monitoring; no workflow-file write permission is needed.
2. Confirm your account and token can update target `master` directly under its repository rules. Do not weaken branch rules or replace direct publication with PR creation silently. If fine-grained tokens cannot access the repository for your account (for example, an outside collaborator), a classic token with **public_repo** can access this public target repository. Complete SSO authorization if required. See [GitHub's token setup and limitations](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).
3. In **davidwesst/website → Settings → Secrets and variables → Actions → Repository secrets**, create **WESTERN_DEVS_TOKEN** with the token value. This single source-repository secret is used for target checkout, publication, and target workflow monitoring. There is no token secret to configure on the Western Devs repository. Remove obsolete `WESTERN_DEVS_APP_CLIENT_ID` / `WESTERN_DEVS_APP_PRIVATE_KEY` configuration if previously added; they are no longer used.
4. Leave `WESTERN_DEVS_ENABLED` unset or `false` while reviewing conversion and validating the target build. The feature is disabled by default and missing credentials are never treated as success when enabled.
5. Verify the activation commit, run `pnpm crosspost:western-devs plan` against a built artifact whose identity matches the checkout, and inspect `.cache/western-devs/report.json`. The unchanged activation release must produce zero eligible articles. Existing article conversion is covered by fixtures; it is not historical publication eligibility.
6. Set `WESTERN_DEVS_ENABLED=true` when setup is complete. Once `article-sharing.yml` exists on the default branch, the next completed CI/CD run with a successful `main` push deployment starts article sharing. Articles added after the activation boundary, including while the integration was disabled, qualify; choose the enablement timing accordingly.

No target templates, configuration, or deployment workflow are modified. The target's existing push workflow publishes the submitted commit.

Personal-token-authenticated commits trigger the target's push workflow. The source repository's built-in `GITHUB_TOKEN` cannot replace this cross-repository token. See [GitHub's workflow-trigger authentication guidance](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

## Validation

Run `pnpm build` and `pnpm test`, including main and non-main build modes. Focused tests cover source Git history, metadata/body conversion, duplicate identities/URLs, removed target posts, atomic commits, concurrent target updates, lost responses, and target deployment outcomes. Use a disposable target checkout to run its existing Hexo build against generated fixture posts. Inspect author, excerpt, category, tags, canonical attribution, code, images, and embeds.

During implementation on 2026-10-13, the unchanged target build accepted two existing-article fixtures and a synthetic code/table/iframe fixture. Inspection confirmed the source canonical, summary, table, iframe, and literal `{{ value }}` / `{% endraw %}` code survived. These were disposable local fixtures, not published posts.

`pnpm crosspost:western-devs plan` writes previews under `.cache/western-devs/preview` and never writes to GitHub. `publish` requires an enabled GitHub Actions `workflow_run` context, a verified source-release gate, and a completed source `main` push event. It checks the source event's commit and run identity against the downloaded deployment manifest, preserving the artifact's original build attempt. It invokes the established canonical live-release verifier with that source commit before submission. The sharing workflow's own default-branch SHA and run ID are never used as the source release identity, and it never rebuilds the site.

## Results and recovery

The article-sharing summary and its `western-devs-report` artifact distinguish submitted posts, previously submitted posts, target deployments, and failures. The report includes originating CI/CD run/attempt, source commit/build identity, and target commit/run links. Conversion failure submits nothing in that batch. A target path collision stops publication rather than overwriting it. Sharing failures affect only article-sharing's result, not the original site's CI/CD result.

Ref updates are non-forced. The publisher retries at most three times after reconciling the current target history. A lost response after a successful write is recognized as an acknowledged submission. A later successful source deployment or a failed-job rerun of article-sharing retries articles not acknowledged by the target; target edits and deletions are never synchronized. Production sharing runs are serialized without cancelling an active run.

Target workflow discovery and completion are bounded to ten minutes per submitted commit. Failed or timed-out target deployment fails article-sharing without rolling back the source site. Retry the existing Western Devs workflow run; article-sharing reruns inspect that same commit and do not create another article. A permanently removed crosspost remains acknowledged in target history. If a newer source deployment supersedes the original release, the live identity verifier prevents sharing the stale artifact; the newer run reconsiders unpublished eligible articles.

Disable future publication by setting `WESTERN_DEVS_ENABLED=false`. Historical source/target Git history is required; a missing activation boundary fails explicitly rather than resetting eligibility. Do not rewrite either history or change the activation boundary to recover a transient failure.

Before the token expires, create a replacement with the same target access and update the source repository's `WESTERN_DEVS_TOKEN` secret. An unset token fails the enabled workflow before target checkout. An expired, revoked, unapproved, or insufficiently permitted token fails checkout or the GitHub request; it never falls back to another credential. Updating the secret and rerunning the failed job preserves publication identities and duplicate protection.

Retain `redirectFrom` when renaming and heavily rewriting a document. Git rename detection, unchanged slugs, and redirects preserve content identity across family moves. An addition combined with an unrecognizable document deletion fails as ambiguous; separate new additions from unrelated deletions before merging. Already acknowledged articles are skipped before conversion, so later edits cannot require another target conversion or publish an update.
