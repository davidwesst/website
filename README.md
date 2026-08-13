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

## IGDB game data

Gamelogs are enriched at build time from their authored IGDB IDs. Register a confidential Twitch application with two-factor authentication enabled and `localhost` as its OAuth redirect URL, then provide `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` as environment variables. Add the same names as repository Actions secrets for GitHub builds. Access tokens are created only during cache refreshes and are never stored.

Normalized metadata and downloaded artwork are cached in `.cache/igdb/` for 24 hours. Builds without credentials reuse stale data when available and otherwise render the existing gamelog placeholders without failing.

The previous site, its content, and its tooling are retained in `_archive` for reference. Nothing in that folder participates in the active build or test suite.
