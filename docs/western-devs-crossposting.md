# Manual article sharing

Article sharing is an owner CLI, invoked through pnpm. It selects one article by slug and one repository-configured destination. `wd` means Western Devs. There is no sharing GitHub workflow or CI/CD dispatcher, and the CLI needs no GitHub Actions context or enablement variable.

## Preview and experiment

```text
pnpm build
pnpm share jan-2020-devlog wd
```

The default command makes no network requests and needs no credentials. It converts only the selected article from the current `_site` build and writes a Hexo post, copied images, and `report.json` beneath a unique `.cache/sharing/wd/jan-2020-devlog/<invocation-id>/` directory. The terminal prints that directory and report path. The generated `source/` tree can be inspected or copied into a disposable Western Devs checkout for a local Hexo build. Each invocation preserves earlier previews for comparison.

Edit the authored article or its assets, rebuild, and rerun the command to test changes. A missing built article, missing build identity, or source/asset edit newer than the rendered page produces a rebuild instruction. Preview works with uncommitted local articles and does not require a production deployment. Historical articles can also be selected explicitly; the former automatic activation cutoff is gone. Devlogs qualify as articles. Gamelogs, dungeonlogs, talks, and pages are rejected.

Use `pnpm share --help` for command syntax. Both the slug and destination are required. Slugs are directory names such as `jan-2020-devlog`, rather than full URLs or file paths.

## Destination configuration

`config/sharing.json` owns `sourceRepository` and a `destinations` map. Each destination key is a CLI parameter. The configured `wd` destination uses:

| Setting | Purpose |
| --- | --- |
| `name` | Friendly name in CLI output |
| `adapter` | Conversion format; currently `western-devs` |
| `repository` | GitHub target, `westerndevs/western-devs-website` |
| `branch` | Target branch, `master` |
| `workflow` | Target deployment workflow checked by `--wait`, `ci-cd.yml` |
| `authorId` | Western Devs author identity, `david_wesst` |
| `tokenEnv` | Local token environment variable, `WESTERN_DEVS_TOKEN` |

Destination aliases and repositories are configuration data. Another destination can reuse the Western Devs adapter; a different publishing format requires its own adapter implementation. Tokens never belong in the configuration file. Source canonical URLs continue to use the shared site configuration.

## Explicit publication

```text
pnpm share jan-2020-devlog wd --publish
pnpm share jan-2020-devlog wd --publish --wait
```

`--publish` reconverts the selected article from the current local build, preserves a preview/report, and submits one atomic non-forced commit. It does not certify that this source build is deployed in production; publish only the article snapshot you intend to share. Without `--wait`, the command returns after submission. With `--wait`, it monitors the configured target workflow for the exact submitted commit for up to ten minutes and records its run link and result.

Set `WESTERN_DEVS_TOKEN` in the local shell environment before using `--publish`. The CLI does not retrieve GitHub Actions repository secrets. Prefer a fine-grained personal access token with resource owner **westerndevs**, selected repository **western-devs-website**, **Contents: read/write**, and **Actions: read** for optional deployment monitoring. Metadata read is implicit. Complete any required organization approval. No workflow-file write permission is needed. If GitHub's fine-grained-token support does not cover your outside-collaborator access, a classic token with `public_repo` is the compatibility fallback for this public target.

The publication token is used only for GitHub API requests and is never saved in Git remotes or reports. Target history is read from an ignored public checkout under `.cache/sharing/targets/wd`. Existing source-repository `WESTERN_DEVS_ENABLED` and Actions-secret settings are unused by this CLI and can be removed separately; no repository setting enables automatic sharing.

## Mapping and recovery

The adapter retains the title, authored publication/update dates, configured author ID, every topic as a tag, the first topic as the sole category, summary as excerpt, built description, and source canonical URL as `originalurl`. Date-only values use noon in the target timezone to retain their calendar date; explicit offsets remain intact. It exports the authored HTML inside a Hexo Markdown raw block and copies original article-owned images. Literal template braces remain literal. Unsupported executable embeds and missing images fail before submission. Neither site's templates change. Western Devs' standard meta description remains hard-coded; supported descriptions and excerpts are preserved.

Preview always prepares the selected article, including an article already present on the target. Publication first reads target history and skips acknowledged identities or original URL aliases, including removed posts and earlier automated crossposts. Already submitted articles are never edited or reposted. Retain `redirectFrom` when renaming a source article so its former canonical URL remains an acknowledgement alias.

Ref-update conflicts, lost responses, and ambiguous HTTP 5xx responses cause bounded history reconciliation, with at most three publication attempts. Successful writes whose responses were lost are acknowledged without another submission. Authentication and permission errors remain fatal. Destination path collisions stop publication instead of overwriting another contributor.

Every attempted conversion/publication writes a report with the selected source/destination, preview files, build identity when converted, published or acknowledged commit, deployment results, and failures. A failed target deployment preserves the submitted commit. Retry that existing Western Devs workflow run; another `--publish` invocation acknowledges the existing article, and `--publish --wait` can inspect its deployment again. Conversion failures submit nothing. Rebuild and prepare another preview to correct local content issues.
