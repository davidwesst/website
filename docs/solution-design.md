# Solution Design

## Purpose

This repository contains David Wesst's active Eleventy website and its normalized authored-content model. The former merged-site implementation remains in `_archive` as a migration source only: normal builds, tests, integrity checks, and deployment inputs must not read it.

## Current Scope

The active site publishes:

- a home page plus migrated About and Projects pages
- articles, gamelogs, and dungeonlogs discovered from the active authored-content inventory
- talks and their appearances discovered from the active authored-content inventory
- Blog, Articles, Gamelogs, Dungeonlogs, Talks, and Topics indexes
- generated pages for topics shared by posts and talks
- stable content assets and legacy URL compatibility

Talks are a separate content family from posts. Both use the shared authored fields and presentation components, while their type-specific data remains under `customData`.

## Technology

- Node.js at the version declared by the repository runtime configuration
- pnpm at the version declared by the package manager configuration
- Eleventy at the version declared by the dependency manifest
- Markdown for authored content and index pages
- WebC for layouts and reusable web components
- Tailwind CSS at the version declared by the dependency manifest
- Font Awesome Free for locally hosted post-type icons
- Node scripts for deterministic migration and output integrity validation

## Authored content model

Authored documents live beneath `src/content/` as Markdown `index.md` files grouped into `pages`, `posts/articles`, `posts/gamelogs`, `posts/dungeonlogs`, and `talks`. Images owned by an individual document are stored in the same directory as that document and referenced with a relative `./filename` path.

Posts and talks require `title` and an explicit publication `date`. Static pages require `title`. The optional shared fields are `summary`, `updated`, `topics`, `redirectFrom`, `banner`, and `customData`. A banner contains `src`, meaningful `alt`, and optional `credit`.

Eleventy derives the slug from `page.fileSlug`. All post types share a flat canonical detail route while directory data continues to derive layout, type, and collection tags:

- articles: `posts` and `articles`, at `/blog/{slug}/`
- gamelogs: `posts` and `gamelogs`, at `/blog/{slug}/`
- dungeonlogs: `posts` and `dungeonlogs`, at `/blog/{slug}/`
- talks: `talks`, at `/talks/{slug}/`
- pages: at `/{slug}/`

Post slugs must be globally unique across all supported post types and cannot use the reserved type-index slugs `articles`, `gamelogs`, or `dungeonlogs`. The filtered indexes live at `/blog/articles/`, `/blog/gamelogs/`, and `/blog/dungeonlogs/`. Topics are authored taxonomy values, separate from Eleventy collection tags. Topic routes use normalized slugs and combine posts and talks in descending publication order. Canonical topic pages live under `/topics/`; legacy `/categories/` pages remain noindex compatibility forwarders.

Gamelog-specific authored data is stored under `customData.game.ids`, `customData.playthrough`, and `customData.ratings`. Every gamelog has an IGDB ID. Before Eleventy renders, a source-specific preparation layer joins those IDs to normalized IGDB game data containing the earliest release date, developers, publishers, collection-based series membership, ESRB/PEGI/CERO age ratings, and an optional generated banner. IGDB data remains derived build data rather than authored front matter, and presentation components receive only the normalized model. Talk-specific data is stored under `customData.speakers` and `customData.appearances`. A talk's page `date` is its original publication date when recoverable, otherwise its latest presentation date. The resolved page date controls collection sorting; individual appearance dates do not otherwise participate in sorting.

## Rendering

`src/_includes/layouts` contains focused WebC layouts for the home page, posts, talks, static pages, collections, and topic pages. `src/_includes/components` contains reusable navigation, footer, social-link, post-card, post-visual, topic, banner, gamelog, and talk-detail components. The base WebC shell provides site navigation and one main landmark.

Detail pages render semantic articles with a single top-level heading, publication metadata, topics, banner figures or type-specific fallback artwork, Markdown body content, and applicable type-specific data. Gamelogs additionally render normalized game details separately from authored playthrough details. Their visual precedence is an authored banner, generated IGDB artwork, generated IGDB screenshot, then the accessible gamelog placeholder. Indexes use semantic content cards. The combined Blog index uses single-column cards with cropped banners, summary-or-introduction descriptions, and progressively enhanced, default-enabled type filters for articles, gamelogs, and dungeonlogs. The Ghostwind-inspired presentation uses a gradient masthead, elevated cards, local Font Awesome icons, and readable serif body typography; `src/styles/main.css` remains the single authored stylesheet entry point.

Repository-controlled global site data defines the title, tagline, social links and their Font Awesome icon classes, post-type labels/icons/colors, recent-post count, and optional featured-post canonical URL. The same social-link component renders labeled icon links in the home hero and site footer. A null featured-post value selects the newest post; an invalid explicit URL fails the build.

## Migration and assets

`tools/content-migration/migrate.mjs` is the only active tool allowed to read `_archive`. It parses archived front matter and event records, normalizes taxonomy and type-specific data, rewrites recoverable image references, records missing images, removes unsupported migration artifacts, and produces the active content through a staging directory.

- `pnpm content:migrate` performs the initial migration and refuses to overwrite existing content or assets.
- `pnpm content:migrate:check` regenerates the expected result in a temporary directory and verifies that the migrated subset of active content still matches without writing. New authored documents outside the migration manifest are allowed.

Available authored binary assets are copied byte-for-byte beside their owning `src/content/.../index.md` file. Eleventy maps each colocated authored image to the same canonical output directory as its rendered document, so source ownership and published ownership remain aligned. `src/_data/migration-manifest.json` records source and colocated destination hashes. `src/_data/asset-exceptions.json` records unavailable images; rendered content uses semantic unavailable-image notes instead of broken image elements.

IGDB banner images are generated build assets rather than authored banners. The preparation step downloads artwork or screenshots at the resolution selected by the preparation configuration into the ignored `.cache/igdb/images/` directory, and Eleventy publishes them under `/assets/igdb/`. Known poor-fit IGDB banner image IDs can be rejected by the preparation layer so the deterministic selection falls through to a better candidate or placeholder. The accompanying normalized manifest uses the freshness window defined by the cache implementation. A stale manifest remains a non-blocking fallback when credentials or IGDB are unavailable; a build without any usable cache retains the existing placeholders. Cache refresh uses a batched games request for the current inventory, bounded retries for rate limits and server errors, and the download concurrency defined by the preparation implementation. The Twitch app access token is ephemeral and is never written to the cache.

Azure routing is generated as `staticwebapp.config.json`, with trailing slashes, explicit redirects for changed canonical locations, and a size assertion. Archived hierarchical gamelog and dungeonlog detail routes redirect to the flat canonical post routes. Query-based legacy gamelog URLs use a generated noindex dispatcher at `/blog/gamelog/entry.html` backed by a validated slug map. RSS feeds can later select the existing `posts`, `articles`, `gamelogs`, and `dungeonlogs` collections independently of canonical URL shape.

## Validation

The production build removes only `_site`, prepares the optional IGDB cache, renders the site, copies assets, and compiles the existing stylesheet. `pnpm check:content` validates active source data and rendered output without reading `_archive`, including:

- source-derived document and appearance count consistency across authored content, rendered indexes, and the migration manifest
- normalized schemas, dates, type-specific custom data, topics, globally unique post slugs, reserved routes, and canonical URLs
- redirect uniqueness, coverage, collision safety, and query-based gamelog mappings
- asset colocation, hashes, exact filename casing, rendered image existence, acceptable alt text, and missing-image exceptions
- local links and fragments
- expected output for every migrated document
- semantic page structure and representative type-specific rendering
- absence of archive paths, raw front matter, unresolved WebC data, and migration markers

`pnpm test` performs a production build, runs `check:content`, and then runs the Node test suite. Output tests retain home-page and stylesheet coverage and add representative checks for articles, gamelogs, dungeonlogs, talks, pages, indexes, topics, compatibility pages, redirects, and the legacy dispatcher. CI runs this complete suite on the repository-configured Node.js runtime and deploys the generated `_site` artifact.
