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
- production-only client operational telemetry for diagnosing errors, load performance, and failed network requests
- production-only, privacy-first aggregate engagement analytics

Talks are a separate content family from posts. Both use the shared authored fields and presentation components, while their type-specific data remains under `customData`.

## Technology

- Node.js at the version declared by the repository runtime configuration
- pnpm at the version declared by the package manager configuration
- Eleventy at the version declared by the dependency manifest
- Markdown for authored content and index pages
- WebC for layouts and reusable web components
- Tailwind CSS at the version declared by the dependency manifest
- Font Awesome Free for locally hosted post-type icons
- the lockfile-controlled Application Insights JavaScript SDK, bundled at build time and served as a first-party asset
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

Repository-controlled global site data defines the title, tagline, social links and their Font Awesome icon classes, post-type labels/icons/colors, home-section limits, and optional featured-content canonical URL. The same social-link component renders labeled icon links in the home hero and site footer. A null featured value selects the newest eligible article, gamelog, or talk; an invalid explicit URL fails the build. Those three families receive independent recent-content sections. Dungeonlogs remain available through blog, topic, feed, and direct routes but are excluded from automatic home-page promotion.

The base shell contains only minimal integration points for telemetry. Source-specific configuration, filtering, and sanitization remain isolated from presentation code. The integrations are emitted only for the `main` branch and load executable code exclusively from the site's `/assets/` path.

Canonical pages derive descriptions, canonical URLs, Open Graph fields, preview images, publication metadata, and Schema.org JSON-LD through a shared metadata preparation layer. Preview images prefer authored banners, then normalized gamelog artwork, then the repository-owned default social image. Canonical content is exposed through a generated sitemap, robots policy, and Atom feeds for the combined blog and each content family; redirect and noindex compatibility pages are excluded.

Post and talk detail pages expose deterministic related content ranked by shared topics, same-family membership, recency, and canonical URL. They also provide chronological navigation within the current family plus archive and topic pathways. Detail pages provide progressively enhanced native sharing, canonical-link copying, and direct Bluesky, LinkedIn, and email links. Visitor sharing never adds campaign parameters; a development-only generator validates built pages and emits consistent platform campaign URLs for owner-published distribution.

## Operational telemetry

The `main` branch is the production site. Its build requires `APPLICATIONINSIGHTS_CONNECTION_STRING` and fails before rendering when that value is missing or invalid. Other branches do not generate or reference the telemetry asset, even if the connection string is present, so development and pull-request activity cannot contaminate production telemetry. Eleventy's development server does not reference telemetry on any branch; its built-in run mode distinguishes serving from a production build without a separate environment flag. Build context is derived from `GITHUB_REF_NAME` when available and otherwise from the current Git branch.

Application Insights is limited to operational observability. It collects uncaught client exceptions, unhandled promise rejections, page-load performance, failed XMLHttpRequest and Fetch dependencies, and coarse browser, operating-system, device-category, and Azure-provided geographic context. Successful dependencies, clicks, custom engagement events, time on page, single-page-application route changes, request and response headers, DOM or authored content, query strings, fragments, and persistent user or session identifiers are excluded.

The client disables cookies and local and session storage. A telemetry initializer removes user, authenticated-user, and session identifiers; reduces page and dependency URLs to origins and pathnames; sanitizes exception URLs; discards successful dependencies; and prevents ingestion requests from being recorded as dependencies. Azure IP masking remains enabled so the ingestion service can derive coarse geography without retaining the client IP address.

The official browser SDK is a lockfile-controlled build dependency. Every production build bundles the installed version together with the repository-controlled initializer and publishes the result as `/assets/telemetry/application-insights.js`. No runtime CDN fallback is allowed. The Azure ingestion endpoint remains an external data destination, but all executable browser resources are served by the site itself. SDK upgrades are intentional dependency updates rather than floating downloads during a build.

## Migration and assets

`tools/content-migration/migrate.mjs` is the only active tool allowed to read `_archive`. It parses archived front matter and event records, normalizes taxonomy and type-specific data, rewrites recoverable image references, records missing images, removes unsupported migration artifacts, and produces the active content through a staging directory.

- `pnpm content:migrate` performs the initial migration and refuses to overwrite existing content or assets.
- `pnpm content:migrate:check` regenerates the expected result in a temporary directory and verifies that the migrated subset of active content still matches without writing. New authored documents outside the migration manifest are allowed.

Available authored binary assets are copied byte-for-byte beside their owning `src/content/.../index.md` file. Eleventy maps each colocated authored image to the same canonical output directory as its rendered document, so source ownership and published ownership remain aligned. `src/_data/migration-manifest.json` records source and colocated destination hashes. `src/_data/asset-exceptions.json` records unavailable images; rendered content uses semantic unavailable-image notes instead of broken image elements.

IGDB banner images are generated build assets rather than authored banners. The preparation step downloads artwork or screenshots at the resolution selected by the preparation configuration into the ignored `.cache/igdb/images/` directory, and Eleventy publishes them under `/assets/igdb/`. Known poor-fit IGDB banner image IDs can be rejected by the preparation layer so the deterministic selection falls through to a better candidate or placeholder. The accompanying normalized manifest uses the freshness window defined by the cache implementation. A stale manifest remains a non-blocking fallback when credentials or IGDB are unavailable; a build without any usable cache retains the existing placeholders. Cache refresh uses a batched games request for the current inventory, bounded retries for rate limits and server errors, and the download concurrency defined by the preparation implementation. The Twitch app access token is ephemeral and is never written to the cache.

Application Insights browser code is also generated build data rather than authored content. Its preparation step writes only beneath `.cache/telemetry/`, and Eleventy publishes the resulting bundle under `/assets/telemetry/`. A production build fails instead of falling back to a third-party executable resource when telemetry configuration or asset preparation is unavailable.

Simple Analytics owns aggregate engagement analytics: page views, referrers, UTM campaign values, time on page, scroll depth, and coarse browser/device information. It does not own errors, performance, or failed-request diagnostics. Session metrics and custom events are disabled, Do Not Track is respected, and the integration uses no cookies, browser storage, persistent visitor identifiers, user-generated content, or intentionally collected PII. Its required collection requests remain external to the Simple Analytics endpoint.

The telemetry preparation step downloads the Simple Analytics browser library from an exact upstream commit, verifies its repository-controlled SHA-256 digest, and publishes it as `/assets/telemetry/simple-analytics.js`. Production builds fail when the pinned resource cannot be downloaded or verified. Updating the library is an intentional source-commit and digest change; no runtime third-party executable fallback is allowed.

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
- production-branch telemetry configuration, first-party script URLs, generated asset existence, and privacy-sensitive client settings
- absence of telemetry integration on non-production branches and absence of runtime third-party executable telemetry resources
- Simple Analytics production gating, pinned asset integrity, Do Not Track behavior, and session-metric exclusion

`pnpm test` performs a branch-aware build, runs `check:content`, and then runs the Node test suite. Output tests retain home-page and stylesheet coverage and add representative checks for articles, gamelogs, dungeonlogs, talks, pages, indexes, topics, compatibility pages, redirects, the legacy dispatcher, and telemetry policy. CI runs this complete suite on the repository-configured Node.js runtime. Builds of `main` receive the required Application Insights connection string, verify and upload the telemetry-enabled `_site` artifact, and deploy it; builds of every other branch verify telemetry-free output.
