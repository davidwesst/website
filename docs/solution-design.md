# Solution Design

## Purpose and authority

David Wesst's website helps readers discover his game development, devlogs, and Cocoboko Studios, and contributes writing and talks to the technology community. Website visits and engagement measure on-site discovery; distribution through feeds or other readers can contribute to the community without producing a website visit.

This document is the canonical implementation contract for the active site. It records responsibilities, data ownership, and behavior that changes must preserve. Task procedures belong in skills; dated observations, account setup, and incident evidence belong in the linked runbooks. Plans from other chats or branches become implemented architecture only when their source changes are present here.

## Scope and boundaries

The Eleventy site publishes Home, About, Projects, articles, gamelogs, dungeonlogs, talks and appearances, family indexes, and shared topic pages. It preserves content assets and legacy URLs and provides production-only engagement analytics and browser diagnostics.

- Active authored content lives in `src/content/`. `_archive` is a migration source only; normal builds, tests, integrity checks, and deployment inputs never read it.
- The separate `website-insights` project owns private telemetry snapshots, atomic provider collection, health assessments, and report exports. This repository owns website behavior and fixes informed by those reports. Its build has no dependency on the reporting project or its archives.
- External publishing, account changes, DNS changes, and retired-resource cleanup are separate operations. Website sharing and campaign-link generation provide owner tools without automatically publishing announcements.

The stack is Node.js, pnpm, Eleventy, Markdown, WebC, Tailwind CSS, locally hosted Font Awesome Free, and focused Node preparation/validation tools. Runtime and dependency versions come from `.nvmrc`, `package.json`, `pnpm-workspace.yaml`, and the lockfile. Cloudflare Workers Static Assets hosts the output; Cloudflare DNS is authoritative for `wes.st`.

## Responsibility map

Keep source-specific behavior in adapters or preparation code and give presentation components normalized data. Add the smallest coherent unit with one responsibility.

| Responsibility | Implementation boundary |
| --- | --- |
| Authored content, family defaults, public identity | `src/content/`, directory data, `src/_data/site.js` |
| External data, image and telemetry preparation | Focused `tools/prepare-*.mjs` entrypoints and `lib/` modules |
| Metadata, discovery, navigation, display models | `src/_lib/` and focused `src/_data/` providers |
| Accessible rendering and progressive enhancement | `src/_includes/`, `src/assets/`, `src/styles/main.css` |
| Canonical/legacy routes and provider output | `lib/content-routing.js`, `lib/hosting-routes.js`, `lib/legacy-route-repairs.js` |
| Integrity, hosting verification, deployment and notification | `tools/check-*.mjs`, `lib/hosting-*.js`, `lib/indexnow.js`, tests, GitHub Actions |

`_site` is a generated release artifact. Ignored `.cache` directories hold derived data and local evidence; neither replaces authored source or repository-controlled configuration.

## Authored content and routes

Documents are Markdown `index.md` files in the family directories below. Document-owned images are colocated and referenced as `./filename`. Posts and talks require `title` and an explicit publication `date`; static pages require `title`. Optional shared fields are `summary`, `updated`, `topics`, `redirectFrom`, `banner`, and family-supported `customData`. Banners require `src` and meaningful `alt`, with optional `credit`. Slugs derive from `page.fileSlug`; directory data derives layout, type, and collection tags.

| Family | Source under `src/content/` | Canonical detail route | Collections |
| --- | --- | --- | --- |
| Article | `posts/articles/` | `/blog/{slug}/` | `posts`, `articles` |
| Gamelog | `posts/gamelogs/` | `/blog/{slug}/` | `posts`, `gamelogs` |
| Dungeonlog | `posts/dungeonlogs/` | `/blog/{slug}/` | `posts`, `dungeonlogs` |
| Talk | `talks/` | `/talks/{slug}/` | `talks` |
| Page | `pages/` | `/{slug}/` | `pages` |

Post slugs are globally unique across post types and reserve `articles`, `gamelogs`, and `dungeonlogs` for `/blog/{family}/` indexes. Topics are authored taxonomy, separate from Eleventy collection tags. Normalized `/topics/{slug}/` pages combine posts and talks in descending publication order. Devlogs are articles with the `devlog` topic, reachable at `/topics/devlog/`.

Gamelog authored data lives under `customData.game.ids`, `customData.playthrough`, and `customData.ratings`. Every gamelog has an IGDB ID. Preparation joins it to normalized game metadata: earliest release date, developers, publishers, collection-based series, ESRB/PEGI/CERO ratings, and optional imagery. These remain derived data; game details render separately from authored playthrough details.

Talks are a separate content family with `customData.speakers` and `customData.appearances`. A talk's page date is its recoverable original publication date, otherwise its latest presentation date. That resolved date controls collection sorting; individual appearances do not independently reorder the talk.

## Rendering and reader pathways

Focused WebC layouts compose reusable components. The base shell supplies navigation and one main landmark; detail pages use a semantic article and one top-level heading, publication metadata, topics, visuals, Markdown body, and applicable family data. The footer provides shared social links and IGDB attribution. Global data supplies identity, navigation, social icons, family labels/colors, and home-section limits. The Ghostwind-inspired presentation retains a gradient masthead, elevated cards, local icons, readable serif prose, and one authored stylesheet entrypoint, `src/styles/main.css`.

The Blog index uses single-column cards, cropped banners, summary-or-introduction descriptions, and progressively enhanced, initially enabled family filters. Gamelog visual precedence is authored banner, IGDB artwork, IGDB screenshot, then accessible placeholder.

Home features the newest article, gamelog, and talk in labeled tabs with a pause switch and accessible manual controls. Reduced motion disables automatic cycling until explicitly started; keyboard focus within the feature pauses cycling, while hover does not. Featured content remains in independent recent-family sections. Dungeonlogs remain available through blog, topic, feed, and direct routes and receive no automatic home promotion.

Detail pages offer deterministic related content ranked by shared topics, family, recency, and canonical URL, plus chronological family navigation and archive/topic links. Repository-controlled discovery data adds devlog and studio pathways on relevant pages without rewriting migrated prose. Native sharing, canonical-link copying, and Bluesky, LinkedIn, and email links use untracked canonical URLs. Owner-generated campaign links validate the built page and use the existing campaign model.

## Assets and migration

Original authored assets retain their bytes, filenames, hashes, and canonical/legacy URLs. Eleventy publishes colocated images beside their owning page. `src/_data/migration-manifest.json` records migration destinations and hashes; `src/_data/asset-exceptions.json` records unavailable images, which render semantic notes instead of broken image elements.

`tools/content-migration/migrate.mjs` is the only active tool permitted to read `_archive`. It normalizes archived content through staging, preserves migration repairs, refuses to overwrite existing content/assets on initial migration, and supports comparison of the migrated subset. New authored documents outside the manifest are allowed.

Image responsibilities remain separate:

- Responsive preparation discovers active static PNG/JPEG/WebP images of at least 1,000,000 bytes, creates bounded WebP widths without enlargement, and advertises only smaller derivatives. Verified cache: `.cache/responsive-images`; content-addressed output: `/assets/responsive/`. Components consume normalized `displayBanner` data; a separate transform handles inline prose images. Original-format fallbacks, alt text, and intrinsic dimensions remain intact.
- IGDB preparation caches normalized metadata and selected artwork/screenshots under `.cache/igdb`, publishing images at `/assets/igdb/`. Poor-fit image exclusions belong in preparation. Cache freshness, bounded retries, and download concurrency come from the implementation. Stale data is a non-blocking fallback; an unavailable cache retains placeholders. Twitch access tokens stay ephemeral and are never cached.
- Social preparation uses Sharp to fit complete images against a dark background without cropping, producing content-addressed 1200×630 JPEGs at `/assets/social/`. Selection prefers authored banners, normalized gamelog imagery, then the repository-owned default image. Originals remain intact.

Measured image evidence and audit conditions are in [responsive-images.md](responsive-images.md).

## Discovery and distribution

Shared metadata supplies descriptions, absolute canonical URLs, Open Graph fields, image dimensions/type/alt, article-only timestamps, and Schema.org JSON-LD. Preview metadata and schema select the same image. David remains the author, represented by the stable `https://david.wes.st/#person` entity; Cocoboko Studios is his founder affiliation. About is a `ProfilePage`; structured breadcrumbs match visible navigation.

One canonical inventory drives sitemap coverage and IndexNow fingerprints. Sitemap `lastmod` uses explicit authored publication/update dates. Redirects, noindex compatibility pages, and operational manifests are excluded. Atom feeds already publish summaries and canonical links for the combined blog and individual families, including talks; off-site feed reading does not execute website analytics. Preview `workers.dev` hosts send noindex response headers.

IndexNow runs after a verified `main` production deployment. Saved acknowledged state and pending URLs preserve additions, edits, removals, and failed submissions. Missing historical state requires explicit recovery. Initial 403 responses receive bounded retries only while the public ownership key remains verified; permanent key/request failures remain fatal. Failed-job reruns replace their prior state artifact. Notification failure preserves retry state and does not roll back a healthy site deployment. [search-discovery.md](search-discovery.md) owns account verification, key management, state recovery, and traffic review details.

The repository-owned crawler registry allows traditional search, AI retrieval, and user-directed agents while disallowing GPTBot, ClaudeBot, and Google-Extended. The latter also restricts some Gemini grounding while keeping ordinary Google Search allowed. Public `robots.txt` references the sitemap. Cloudflare managed robots and blanket AI blocking remain off so they do not override the registry. Robots directives are voluntary; probes establish accessibility, not crawler identity, indexing, citations, or prevention of unidentified training. Provider observations and owner validation are in [crawler-policy.md](crawler-policy.md).

## Analytics and privacy

Simple Analytics owns aggregate engagement: page views, referrers, UTM campaigns, time on page, scroll depth, and coarse browser/device data. Session metrics and custom events are disabled. Do Not Track is respected; the integration uses no cookies, browser storage, persistent identifiers, user-generated content, or intentionally collected PII. Collection requests go to its external endpoint.

Application Insights owns uncaught errors, unhandled rejections, failed Fetch/XHR dependencies, page-load timing, and dependency performance; page views provide diagnostic context. Its supported browser SDK uses W3C trace context. Azure's server-side OpenTelemetry distribution is excluded. Do Not Track prevents initialization. Cookies, browser storage, persistent identifiers, click tracking, cross-origin correlation headers, request/response headers, and response bodies are disabled. Simple Analytics and Azure ingestion requests are excluded from dependency auto-collection. The public connection string for `appi-davidwesstcom-prod` is repository configuration, not a secret. Sentry and Cloudflare browser beacons are absent.

Telemetry is emitted only for `main` builds and omitted during Eleventy serving. `GITHUB_REF_NAME` takes precedence over the current Git branch. The base shell provides minimal integration points; source configuration, filtering, and sanitization stay outside presentation. Preparation verifies the Simple Analytics script's exact upstream commit and SHA-256 and bundles the locked Application Insights SDK. Executables are published from `.cache/telemetry` to `/assets/telemetry`; production fails if preparation fails and has no runtime third-party executable fallback.

## Hosting and release integrity

GitHub Actions builds and tests once, verifies the artifact with local Wrangler before upload and after download, and deploys that same artifact with pinned tooling. Staging and production remain isolated. Cloudflare DNS preserves mail and unrelated subdomains; DNS delegation and hosting changes are separate. Temporary Azure rollback output and cleanup gates are documented in [cloudflare-migration.md](cloudflare-migration.md); historical dates are not proof that resources have been retired.

The shared route model generates Cloudflare `_redirects` and temporary Azure rollback configuration. `_headers` preserves security headers and revalidates unversioned content. Hosting provides trailing-slash canonicalization and genuine 404s. Explicit permanent aliases cover legacy routes; provider-limit failures stop the build. `/categories/` pages remain noindex forwarders. Query-based gamelog compatibility uses the validated noindex dispatcher at `/blog/gamelog/entry.html`.

Content-specific aliases belong in `redirectFrom`; evidence-backed migration repairs and shared feed/topic rules belong in `lib/legacy-route-repairs.js`. Migration regeneration retains those repairs. Unresolved requests keep genuine 404s. Route-investigation evidence is in [issue-59-route-triage.md](issue-59-route-triage.md).

Every build emits schema-version-1 `/deployment.json` with its commit and unique build identity: CI run ID/attempt or a local UUID. It is excluded from discovery and served with `Cache-Control: no-store`. Verification checks the artifact commit against the workflow commit and preserves the original identity on deploy-job reruns. A healthy homepage alone never establishes readiness. Live verification uses a monotonic deadline, bounded requests/body reads, and consecutive complete passes bracketed by matching identities; broken assertions remain fatal when convergence expires. Failure logs retain identity and HTTP/Cloudflare diagnostics. Exact timing/concurrency behavior is maintained in the verifier and migration runbook.

## Validation contract and workflow skills

Build preparation cleans only `_site`, prepares IGDB, responsive images, social images and branch-gated telemetry, renders/copies assets, compiles CSS, and generates the IndexNow manifest. Active-source and rendered-output integrity cover schemas/counts/dates, taxonomy/slugs/canonicals, asset ownership/hashes/casing/alt, links/fragments/embeds, redirect coverage/collisions/dispatcher mappings, semantic rendering, discovery output, privacy configuration, and the absence of archive references or unresolved template/migration artifacts.

The Node suite checks observable behavior across content families, components, derived assets, telemetry modes, hosting, and discovery. Local hosting verification covers every generated redirect, exact permanent status, destination/query preservation, published targets, security headers, genuine 404s, telemetry, and crawler policy. CI verifies production telemetry on `main` and telemetry-free output on other branches. Changes review affected tests and preserve these guarantees.

Use the matching workflow skill for task execution; its instructions are subordinate to this contract and the user's current scope:

| Skill | Responsibility |
| --- | --- |
| `$website-validate` | Build/test selection, branch and production modes, affected tools, image audits, and validation evidence |
| `$website-route-triage` | Reproducible route evidence, artifact classification, confirmed repairs, and post-deployment comparison |
| `$website-release-checks` | Failed deployment investigation, artifact identity, local/live verification, and IndexNow failure recovery |
| `$website-discovery-review` | Search/social/crawler review and backlog decisions tied to devlog, studio, and community goals |

Provider collection and health-report creation continue to use the existing skills in `website-insights`.
