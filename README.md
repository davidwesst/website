# david.wes.st -- The Website Project

A minimal Eleventy site using Markdown for content, WebC for components and layouts, and Tailwind CSS for styling.

## Requirements

- Node.js 26
- pnpm 11

## Commands

- `pnpm install` installs dependencies.
- `pnpm dev` starts Eleventy and Tailwind in watch mode.
- `pnpm start` delegates to `pnpm dev`.
- `pnpm build` creates the production site in `_site`.
- `pnpm test` performs a production build, validates content integrity, and runs the Node test suite.
- `pnpm run new gamelog <name>` creates `src/content/posts/gamelogs/<slug>/index.md` from the unpublished `templates/gamelog/index.md` template. Replace its placeholder metadata before building.
- `pnpm campaign:links <canonical-url> [campaign]` emits validated YouTube, Bluesky, LinkedIn, and Instagram campaign URLs for a page in the current `_site` build. Visitor-facing share links always use the untracked canonical URL.

## Content distribution

- YouTube descriptions should link to the corresponding article, gamelog, or talk.
- Bluesky posts should use a short observation or excerpt that leads to the complete canonical page.
- LinkedIn should promote relevant professional articles and talks.
- Instagram should direct suitable game or visual posts to the canonical page.

## IGDB game data

Gamelogs are enriched at build time from their authored IGDB IDs. Register a confidential Twitch application with two-factor authentication enabled and `localhost` as its OAuth redirect URL, then provide `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` as environment variables. Add the same names as repository Actions secrets for GitHub builds. Access tokens are created only during cache refreshes and are never stored.

Normalized metadata and downloaded artwork are cached in `.cache/igdb/` for 24 hours. Builds without credentials reuse stale data when available and otherwise render the existing gamelog placeholders without failing.

The previous site, its content, and its tooling are retained in `_archive` for reference. Nothing in that folder participates in the active build or test suite.

## Cloudflare hosting

GitHub Actions builds and tests once, then deploys the verified artifact to Cloudflare Workers Static Assets. Configure the repository secret `CLOUDFLARE_API_TOKEN` and variable `CLOUDFLARE_ACCOUNT_ID`. Deployment is disabled until `CLOUDFLARE_DEPLOY_ENABLED` is `true`; the existing Azure deployment remains available during migration. See [the migration runbook](docs/cloudflare-migration.md) for staging, cutover, rollback, and final Azure cleanup.

Use `pnpm exec wrangler dev` after a build to verify actual hosting behavior locally. Use `pnpm exec wrangler deploy --env staging` for a telemetry-free branch build. Production uses the default environment. The custom domain is attached during cutover, separately from initial deployment.

## Simple Analytics engagement analytics

Simple Analytics is enabled only on main-branch builds (GITHUB_REF_NAME takes precedence over the local Git branch); Eleventy serving and all other branches omit it. No Azure connection string is required. Simple Analytics is limited to aggregate engagement data. Its integration collects page views, referrers, UTM campaign values, time on page, scroll depth, and coarse browser/device information. Session metrics are disabled, Do Not Track is respected, and no cookies, browser storage, persistent identifiers, custom events, client errors, or authored content are collected. Client-side errors, performance, and failed-request diagnostics are deliberately not collected. No Sentry or Cloudflare browser beacon is installed.

The build downloads the official Simple Analytics browser script from an exact upstream commit, verifies its SHA-256 digest, and publishes it as `/assets/telemetry/simple-analytics.js`. Production builds fail if that pinned asset cannot be downloaded or verified; changing versions requires updating both constants in `tools/prepare-telemetry.mjs`. The browser loads no analytics executable from a third-party CDN, although aggregate page-view requests are sent to Simple Analytics' collection endpoint.
