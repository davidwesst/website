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

## Application Insights operational telemetry

The production site uses Application Insights only for client errors, page-load performance, failed network requests, and coarse environment context. The integration disables cookies and browser storage, removes user and session identifiers, strips query strings and fragments, and discards successful network dependencies. It does not collect clicks, time on page, or custom engagement events.

The `main` branch is production. Builds resolve that context from `GITHUB_REF_NAME` in CI and otherwise from the checked-out Git branch. A `main` build requires `APPLICATIONINSIGHTS_CONNECTION_STRING` and fails when the value is absent or invalid; every other branch omits telemetry even if the variable is present. Eleventy's development server also omits telemetry on every branch, so `pnpm dev` does not require production credentials or report local activity. Configure the connection string as a GitHub Actions secret with that exact name before merging telemetry changes to `main`.

The lockfile-controlled `@microsoft/applicationinsights-web` package is bundled on every production build into `/assets/telemetry/application-insights.js`. The deployed site loads no analytics executable from a third-party CDN. SDK upgrades are made through normal dependency updates so builds remain deterministic; telemetry is still sent to the Azure ingestion endpoint identified by the connection string.

To validate a local checkout of `main`, set `APPLICATIONINSIGHTS_CONNECTION_STRING` and run `pnpm test`. Confirm after deployment that the browser creates no Application Insights cookies or local/session storage, then generate a controlled exception and failed request and verify that Azure receives them without query strings, headers, successful dependencies, or visitor identifiers. Keep IP masking enabled on the Application Insights resource.

## Simple Analytics engagement analytics

Simple Analytics is enabled only on production builds and is limited to aggregate engagement data. Its integration collects page views, referrers, UTM campaign values, time on page, scroll depth, and coarse browser/device information. Session metrics are disabled, Do Not Track is respected, and no cookies, browser storage, persistent identifiers, custom events, client errors, or authored content are collected. Application Insights remains the owner of errors, performance, and failed-request diagnostics.

The build downloads the official Simple Analytics browser script from an exact upstream commit, verifies its SHA-256 digest, and publishes it as `/assets/telemetry/simple-analytics.js`. Production builds fail if that pinned asset cannot be downloaded or verified; changing versions requires updating both constants in `tools/prepare-telemetry.mjs`. The browser loads no analytics executable from a third-party CDN, although aggregate page-view requests are sent to Simple Analytics' collection endpoint.
