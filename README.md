# davidwesst.ca

A minimal Eleventy site using Markdown for content, WebC for components and layouts, and Tailwind CSS for styling.

## Requirements

- Node.js 26
- pnpm 11

## Commands

- `pnpm install` installs dependencies.
- `pnpm dev` starts Eleventy and Tailwind in watch mode.
- `pnpm start` delegates to `pnpm dev`.
- `pnpm build` creates the production site in `_site`.
- `pnpm test` builds the site and verifies that the home page is the only generated HTML page.

The previous site, its content, and its tooling are retained in `_archive` for reference. Nothing in that folder participates in the active build or test suite.
