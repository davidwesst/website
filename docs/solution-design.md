# Solution Design

## Purpose

This document explains how the merged website will be built from the two upstream source sites in [`sources/davidwesst.github.io`](/home/dw/Code/davidwesst/website/sources/davidwesst.github.io) and [`sources/digital-zuihitsu`](/home/dw/Code/davidwesst/website/sources/digital-zuihitsu).

It is written for both human developers and AI agents. The goal is to make the implementation direction explicit, reduce rework, and keep future changes aligned with one canonical model.

## Desired Outcome

The new website should:

- merge both source sites into a single 11ty website
- keep source ingestion separate so each upstream can evolve independently
- normalize both sources into one canonical content model before rendering
- support first-class shared events for talks
- preserve legacy URLs from both old sites through redirects
- reduce the number of top-level content types and naming inconsistencies
- remain easy to extend as new content types, taxonomies, or entities are added

## Guiding Principles

- Separate ingestion from normalization. Source-specific parsing belongs in source loaders, not templates.
- Prefer one canonical model over many source-shaped models.
- Preserve authored data even if the old site ignored it.
- Keep 11ty collections derived from normalized data, not directory conventions.
- Treat redirects as build data, not an afterthought.
- Use stable identities wherever cross-record relationships exist.

## Source Systems

### `davidwesst.github.io`

This is an 11ty + WebC site with:

- singleton pages authored as `.webc`
- blog posts authored as Markdown
- gamelog entries authored as Markdown
- talks authored as Markdown
- site metadata and social links in `_data`-style JS modules

Notable characteristics:

- collection membership is driven by sibling `.11tydata.js` files
- image metadata is not consistently named across all entries
- talks embed event-like data inline through `deliveredAt`
- public URLs are already close to the desired 11ty shape and should be preserved where possible

### `digital-zuihitsu`

This is a Vite site with:

- gamelog entries authored as Markdown
- dungeonlog session entries authored as Markdown
- HTML shell pages that currently drive rendering

Notable characteristics:

- the runtime parser is narrower than the authored source content
- some authored fields are currently ignored but should be preserved
- gamelog detail pages use query-string routes
- dungeonlog is currently rendered as an aggregate page with anchor links

## Canonical Model

The merged site will use three top-level record types:

- `Document`
- `Event`
- `Redirect`

This is the full public shape of the content pipeline. Source-specific formats should not leak past normalization.

### `Document`

Every publishable content item becomes a `Document`.

Fields:

- `id`
- `source`
- `docType`: `page` | `post` | `review` | `session` | `talk`
- `series?`: `blog` | `gamelog` | `dungeonlog` | `talks`
- `slug`
- `title`
- `summary?`
- `body`: `{ markdown: string }`
- `dates`: `{ published?: string, updated?: string, sort?: string }`
- `taxonomy`: `{ tags: string[], categories: string[] }`
- `media?`: `{ image?: string, imageAlt?: string, mediaType?: string, credit?: unknown }`
- `review?`: `{ subjectIds?: Record<string, string | number>, play?: PlayMeta, rating?: RatingMeta }`
- `eventRefs?`: `EventRef[]`
- `canonicalUrl`
- `legacyUrls`: string[]
- `meta`: `{ nativePath: string, sourceMeta: Record<string, unknown>, assets: string[] }`

### `Event`

Every real-world conference, meetup, or talk venue instance becomes an `Event`.

Fields:

- `id`
- `slug`
- `title`
- `summary?`
- `dates`: `{ start?: string, end?: string, sort?: string }`
- `location?`
- `links`: `{ label: string, url: string }[]`
- `canonicalUrl`
- `legacyUrls`: string[]
- `meta`: `{ sourceKeys: string[], sourceMeta: Record<string, unknown>[], aliases?: string[] }`

### `Redirect`

Every old public path that is no longer canonical becomes a `Redirect`.

Fields:

- `from`
- `to`
- `status`: `301`
- `source`: `davidwesst.github.io` | `digital-zuihitsu` | `merged`
- `reason`: `legacy-path` | `canonicalization` | `collection-change` | `query-route`
- `keepQuery?`: boolean

### Nested Types

#### `EventRef`

- `eventId`
- `role?`: `presentedAt`
- `label?`
- `links?`: `{ label: string, url: string }[]`

#### `PlayMeta`

- `startedOn?`
- `completedOn?`
- `platform?`

#### `RatingMeta`

- `gameplay?`
- `narrative?`
- `style?`
- `sound?`
- `overall?`

## Canonical Mapping Rules

### Content Mapping

- standalone `.webc` pages -> `Document` with `docType: page`
- blog posts -> `Document` with `docType: post`, `series: blog`
- gamelog entries from both sources -> `Document` with `docType: review`, `series: gamelog`
- dungeonlog entries -> `Document` with `docType: session`, `series: dungeonlog`
- talks -> `Document` with `docType: talk`, `series: talks`

### Event Mapping

Talk `deliveredAt[]` records are not kept inline as the only representation.

Instead:

- extract each delivered event into an `Event` candidate
- deduplicate those candidates into canonical shared `Event` records
- attach talk-to-event relationships via `eventRefs[]`

### Redirect Mapping

- every canonical `Document` and `Event` gets one `canonicalUrl`
- every old or alternate public path gets added to `legacyUrls`
- every non-canonical legacy path becomes a `Redirect`

## Naming Conventions

The canonical model uses lower camelCase only.

Examples:

- `docType`, not `kind`
- `canonicalUrl`, not `permalink`
- `legacyUrls`, not old route lists with mixed names
- `media.image`, not `featured_image` or `title_image`
- `media.imageAlt`, not `featured_image_alt`
- `review.play.startedOn`, not `started_on`
- `eventRefs`, not `deliveredAt`

Source aliases are resolved during normalization only.

## Source Loader Responsibilities

Each source must have its own loader.

### Loader for `davidwesst.github.io`

Responsibilities:

- parse `.webc` singleton pages
- parse blog markdown entries
- parse gamelog markdown entries
- parse talk markdown entries
- discover colocated assets
- collect current public URLs where derivable
- preserve raw authored front matter in intermediate data

Do not:

- assign canonical field names inside templates
- render HTML as part of ingestion
- embed old route logic in layouts

### Loader for `digital-zuihitsu`

Responsibilities:

- parse gamelog markdown entries
- parse dungeonlog markdown entries
- collect local assets
- collect old Vite shell routes and query-based routes
- preserve authored fields that the current runtime ignores

Do not:

- treat HTML shell pages as durable content records
- flatten dungeonlog support files into publishable entries without explicit design approval

## Normalization Responsibilities

The shared normalization stage converts raw source records into canonical records.

Responsibilities:

- assign stable IDs
- map source-specific content into `Document`
- extract and dedupe `Event`
- compute `canonicalUrl`
- populate `legacyUrls`
- generate `Redirect`
- preserve lossless source metadata in `meta.sourceMeta`

Key field mappings:

- `featured_image` -> `media.image`
- `title_image` -> `media.image`
- `featured_image_alt` -> `media.imageAlt`
- `title_image_alt` -> `media.imageAlt`
- `image_type` / `image-type` -> `media.mediaType`
- `image_credit` / `image-credit` -> `media.credit`
- `play_data` -> `review.play`
- `game_ids` -> `review.subjectIds`
- `deliveredAt` -> extracted `Event` + `eventRefs`

## Event Identity Rules

Shared events are supported immediately.

Deduplication precedence:

1. explicit source event `id`
2. normalized `(title, date)`
3. normalized `(title, startDate, location)`

Rules:

- use deterministic matching only
- do not use fuzzy matching in v1
- treat repeated event branding across different dates as different event instances
- keep talk-specific links on `eventRefs.links`
- keep clearly shared event metadata on `Event`

## Redirect Strategy

Redirects are a first-class part of the solution.

### Requirements

- no legacy public URL should silently disappear
- no redirect chains
- no duplicate `from` paths
- all redirects should point directly to the final canonical URL

### Legacy Paths to Support

#### From `davidwesst.github.io`

- preserve old content URLs whenever possible
- redirect only where the merged site changes canonical structure
- include singleton pages and collection pages if they move

#### From `digital-zuihitsu`

Must support:

- `/blog.html`
- `/blog/gamelog.html`
- `/blog/dungeonlog.html`
- `/blog/gamelog/entry.html?slug=<slug>`
- dungeonlog aggregate and anchor patterns

If dungeonlog becomes per-entry pages:

- redirect aggregate anchors to the canonical session page where possible

If dungeonlog stays aggregate:

- preserve the aggregate route as canonical and avoid unnecessary per-entry redirect expansion

### Redirect Outputs

Redirects are kept in canonical data first, then rendered to platform-specific formats.

Required output targets:

- Netlify `_redirects`
- static HTML redirect fallback pages when host rules are unavailable

## 11ty Build Architecture

The merged 11ty site should be built in these stages:

1. source discovery
2. source loading
3. normalization
4. event extraction and dedupe
5. canonical URL assignment
6. redirect generation
7. 11ty collection derivation
8. page rendering
9. redirect artifact emission

### Expected Data Modules

Recommended `_data` outputs:

- `_data/documents.js`
- `_data/events.js`
- `_data/redirects.js`

These modules should expose fully normalized arrays that templates and collections can consume directly.

### Expected Derived Collections

- `collections.pages`
- `collections.posts`
- `collections.reviews`
- `collections.sessions`
- `collections.talks`
- `collections.events`

Optional aggregate collections:

- `collections.documents`
- `collections.bySeries`

## Implementation Steps

### Phase 1: Source Parsing

- create loader modules for each source
- parse all publishable content and supporting metadata
- identify all source-local assets
- identify all known public legacy paths

Success criteria:

- every source record can be parsed without template involvement
- raw source metadata is preserved

### Phase 2: Canonical Normalization

- convert parsed source records into `Document`
- convert embedded talk events into `Event` candidates
- normalize field naming and dates
- attach provenance and assets

Success criteria:

- no source-specific names leak past this stage
- all publishable content is represented by canonical records

### Phase 3: Shared Event Extraction

- dedupe event candidates
- assign canonical event IDs and URLs
- link talks through `eventRefs`

Success criteria:

- shared events can be referenced by multiple talks
- a talk can reference multiple events

### Phase 4: URL Planning And Redirect Generation

- assign canonical URLs for all documents and events
- collect all legacy URLs
- emit canonical `Redirect` records
- validate no collisions or chains

Success criteria:

- every legacy path is either preserved or redirected
- redirects are deterministic and direct

### Phase 5: 11ty Integration

- expose normalized records through `_data`
- derive collections from canonical data
- build layouts/components around canonical types
- emit redirect artifacts

Success criteria:

- templates do not need source-specific conditionals
- layouts branch only on canonical types and optional nested metadata

## Constraints And Non-Goals

Current non-goals:

- do not preserve the old source rendering stacks inside the new site
- do not use source folder layout as the long-term site model
- do not create many one-off root types for each legacy content subtype
- do not introduce fuzzy entity matching in v1

## Validation Checklist

Before the solution is considered complete, verify:

- every source record becomes exactly one canonical `Document` or intentional support artifact
- every shared event is modeled as an `Event`
- every talk references events through `eventRefs`
- every canonical record has one canonical URL
- every old public URL is either preserved or redirected
- no duplicate redirect `from` values exist
- no redirect chains exist
- no source-specific snake_case names remain in canonical records

## Notes For Agents

- When adding new content support, update the relevant source loader first, not the templates.
- When introducing a new canonical field, document the normalization rule here.
- When adding a new URL shape, update canonical URL generation and redirect validation together.
- Prefer extending nested metadata objects over adding new root types.

## Notes For Human Developers

- If implementation choices conflict with this document, update the document before or during the code change.
- If a source site introduces a new content pattern, preserve it in source metadata first, then decide whether it deserves canonical promotion.
- If event deduplication becomes ambiguous in practice, add explicit source IDs rather than relaxing the matching rules.
