# Solution Design

## Purpose

This repository contains David Wesst's active Eleventy website and its normalized authored-content model. The former merged-site implementation remains in `_archive` as a migration source only: normal builds, tests, integrity checks, and deployment inputs must not read it.

## Current Scope

The active site publishes:

- a home page plus migrated About and Projects pages
- 138 articles, 16 gamelogs, and 12 dungeonlogs
- 12 talks containing 22 appearances migrated from 16 archived event records
- Blog, Articles, Gamelogs, Dungeonlogs, Talks, and Categories indexes
- generated pages for categories shared by posts and talks
- stable content assets and legacy URL compatibility

Talks are a separate content family from posts. Both use the shared authored fields and presentation components, while their type-specific data remains under `customData`.

## Technology

- Node.js 26
- pnpm 11
- Eleventy 3
- Markdown for authored content and index pages
- WebC for layouts and reusable web components
- Tailwind CSS 4 as the existing styling dependency
- Node scripts for deterministic migration and output integrity validation

## Authored content model

Authored documents live beneath `src/content/` as Markdown `index.md` files grouped into `pages`, `posts/articles`, `posts/gamelogs`, `posts/dungeonlogs`, and `talks`. Images owned by an individual document are stored in the same directory as that document and referenced with a relative `./filename` path.

Posts and talks require `title` and an explicit publication `date`. Static pages require `title`. The optional shared fields are `summary`, `updated`, `categories`, `redirectFrom`, `banner`, and `customData`. A banner contains `src`, meaningful `alt`, and optional `credit`.

Eleventy derives the slug from `page.fileSlug`. Directory data derives canonical permalinks, layout, type, and collection tags:

- articles: `posts` and `articles`, at `/blog/{slug}/`
- gamelogs: `posts` and `gamelogs`, at `/blog/gamelog/{slug}/`
- dungeonlogs: `posts` and `dungeonlogs`, at `/blog/dungeonlog/{slug}/`
- talks: `talks`, at `/talks/{slug}/`
- pages: at `/{slug}/`

Categories are authored taxonomy values, separate from Eleventy collection tags. Category routes use normalized slugs and combine posts and talks in descending publication order.

Gamelog-specific data is stored under `customData.game.ids`, `customData.playthrough`, and `customData.ratings`. Talk-specific data is stored under `customData.speakers` and `customData.appearances`. A talk's page `date` is its publication date; appearance dates do not participate in default collection sorting.

## Rendering

`src/_includes/layouts` contains focused WebC layouts for posts, talks, static pages, collections, and category pages. `src/_includes/components` contains reusable content-list, banner, category, gamelog, and talk-detail components. The base WebC shell provides site navigation and one main landmark.

Detail pages render semantic articles with one H1, publication metadata, categories, optional banner figures, Markdown body content, and applicable type-specific data. Indexes use semantic content lists. No migration-specific styling was added; `src/styles/main.css` remains the single existing stylesheet entry point.

## Migration and assets

`tools/content-migration/migrate.mjs` is the only active tool allowed to read `_archive`. It parses archived front matter and event records, normalizes taxonomy and type-specific data, rewrites recoverable image references, records missing images, removes unsupported migration artifacts, and produces the active content through a staging directory.

- `pnpm content:migrate` performs the initial migration and refuses to overwrite existing content or assets.
- `pnpm content:migrate:check` regenerates the expected result in a temporary directory and compares it with active content without writing.

Available binary assets are copied byte-for-byte beside their owning `src/content/.../index.md` file. Eleventy maps each colocated image to the same canonical output directory as its rendered document, so source ownership and published ownership remain aligned. `src/_data/migration-manifest.json` records source and colocated destination hashes. `src/_data/asset-exceptions.json` records unavailable images; rendered content uses semantic unavailable-image notes instead of broken image elements.

Azure routing is generated as `staticwebapp.config.json`, with trailing slashes, explicit redirects for changed canonical locations, and a size assertion. Query-based legacy gamelog URLs use a generated noindex dispatcher at `/blog/gamelog/entry.html` backed by a validated slug map.

## Validation

The production build removes only `_site`, renders the site, copies assets, and compiles the existing stylesheet. `pnpm check:content` validates active source data and rendered output without reading `_archive`, including:

- exact document and appearance counts
- normalized schemas, dates, type-specific custom data, categories, and canonical URLs
- redirect uniqueness, coverage, collision safety, and query-based gamelog mappings
- asset colocation, hashes, exact filename casing, rendered image existence, acceptable alt text, and missing-image exceptions
- local links and fragments
- expected output for every migrated document
- semantic page structure and representative type-specific rendering
- absence of archive paths, raw front matter, unresolved WebC data, and migration markers

`pnpm test` performs a production build, runs `check:content`, and then runs the Node test suite. Output tests retain home-page and stylesheet coverage and add representative checks for articles, gamelogs, dungeonlogs, talks, pages, indexes, categories, redirects, and the legacy dispatcher. CI runs this complete suite on Node.js 26 and deploys the generated `_site` artifact.
