# david.wes.st -- The Website Project

A minimal Eleventy site using Markdown for content, WebC for components and layouts, and Tailwind CSS for styling.

## Requirements

- Node.js 26
- pnpm 12.9.1 (pinned in `package.json`)

## Commands

- `pnpm install` installs dependencies.
- `pnpm dev` starts Eleventy and Tailwind in watch mode.
- `pnpm start` delegates to `pnpm dev`.
- `pnpm build` creates the production site in `_site`.
- `pnpm prepare:images` prepares responsive derivatives of large authored images without modifying their originals. Build and dev startup run it automatically.
- `pnpm images:audit [site-url] [output-json]` records mobile/desktop image transfers and screenshots after installing Chromium with `pnpm exec playwright install chromium`. See [the responsive image audit](docs/responsive-images.md).
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

## Browser analytics and diagnostics

Simple Analytics and Application Insights are enabled only on main-branch builds (`GITHUB_REF_NAME` takes precedence over the local Git branch); Eleventy serving and all other branches omit them. Simple Analytics owns aggregate engagement data: page views, referrers, UTM campaign values, time on page, scroll depth, and coarse browser/device information. Session metrics are disabled, Do Not Track is respected, and it uses no cookies, browser storage, persistent identifiers, custom events, client errors, or authored content.

Application Insights owns browser operational diagnostics for the existing `appi-davidwesstcom-prod` resource: uncaught errors, unhandled promise rejections, failed Fetch/XHR dependencies, and page-load and dependency performance. It uses Microsoft's supported browser SDK with W3C trace context; Azure's OpenTelemetry JavaScript distribution is Node.js-only and is not used in the browser. Cookies, browser storage, cross-origin correlation headers, request/response headers, response bodies, click tracking, and persistent identifiers are disabled. The SDK is not initialized when Do Not Track is enabled. Its public browser connection string is repository configuration, not a credential.

The build downloads the official Simple Analytics browser script from an exact upstream commit, verifies its SHA-256 digest, and publishes it as `/assets/telemetry/simple-analytics.js`. It also bundles the pinned Application Insights package as `/assets/telemetry/application-insights.js`. Production builds fail if either first-party asset cannot be prepared. The browser loads no analytics executable from a third-party CDN. No Sentry or Cloudflare browser beacon is installed.
