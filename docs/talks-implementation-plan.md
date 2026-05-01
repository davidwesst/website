# Talks Section Implementation Plan

## Conflict Check Against `docs/solution-design.md`

No direct conflicts found.

The requested talks planning work aligns with the canonical model and implementation phases in `docs/solution-design.md`, especially:

- canonical `Document` + `Event` + `Redirect` model
- event extraction from talk `deliveredAt`
- deterministic event deduplication
- collection-driven rendering in 11ty
- explicit support for future extensibility via nested metadata and stable IDs

## Goals

Implement a first-class talks experience that:

1. Imports and normalizes talks from `sources/davidwesst.github.io`.
2. Generates canonical pages for:
   - talks index
   - talk detail pages
   - event index
   - event detail pages
3. Establishes bidirectional linked data:
   - talk -> events (`eventRefs`)
   - event -> talks (derived reverse relation)
4. Leaves room for future related entities (blog posts, talk instances, slide decks, videos) without breaking current model contracts.

## Scope and Boundaries

### In Scope (Now)

- Talk ingestion from the davidwesst source.
- Event extraction from talk metadata.
- Event deduplication and canonical IDs.
- URL planning for talks and events.
- Rendering talks and events using canonical data only.
- Redirect coverage for moved or renamed legacy paths.

### Deferred (Future Phases)

- New root canonical types beyond `Document`, `Event`, `Redirect`.
- Fuzzy event matching.
- Rich knowledge graph UI beyond essential cross-links.

## Source Audit and Ingestion Plan

### 1) Inventory Existing Talk Records

Create a source audit task that collects, for each talk markdown file:

- source path
- source slug/permalink
- title/summary/body
- dates
- `deliveredAt[]` entries (including title/date/location/links)
- talk-level links (slides/video/repo if present)
- image/media metadata
- any additional front matter fields

Output of audit: a machine-readable inventory used to validate parsing coverage and detect schema variance.

### 2) Loader Updates (`davidwesst.github.io`)

Extend the source loader to parse talks into source-raw records while preserving authored front matter losslessly in `meta.sourceMeta`.

Requirements:

- No template-level parsing logic.
- No canonical naming in templates.
- Keep all non-canonical fields in raw metadata for future promotion.

## Canonical Data Model Plan for Talks

### 1) Canonical `Document` for Talks

Map each talk to:

- `docType: "talk"`
- `series: "talks"`
- canonical `slug`, `title`, `summary`, `body`, `dates`, `taxonomy`, `media`
- `eventRefs[]` populated from normalized event mapping
- `meta` carrying source provenance and native field retention

### 2) Canonical `Event` Extraction

For each talk's delivered instances:

- create event candidates from `deliveredAt[]`
- normalize title/date/location/links
- dedupe using precedence from solution design:
  1. explicit source event id
  2. `(title, date)`
  3. `(title, startDate, location)`

### 3) Reverse Linking (Derived, Not Stored Redundantly)

Derive event-to-talk relationships in computed data:

- Build a resolver/index: `eventId -> talkDocumentIds[]`
- Use this for event detail rendering and related-talk lists
- Avoid duplicating canonical relationships in both records at write time

## URL and Page Generation Plan

### Canonical URL Shape (Proposed)

- Talks index: `/talks/`
- Talk detail: `/talks/<slug>/`
- Events index: `/events/`
- Event detail: `/events/<event-slug>/`

If legacy talk URLs already match desired talk detail paths, preserve as canonical and reduce redirect churn.

### Page Generation

1. **Talk index page**
   - list talks sorted by `dates.sort` (fallback: published)
   - include latest event badge if available

2. **Talk detail page**
   - render talk content
   - render delivered-at timeline from resolved `Event` records
   - render links specific to each occurrence via `eventRefs.links`

3. **Event index page**
   - list events sorted by `dates.sort`
   - show count of related talks

4. **Event detail page**
   - render event metadata (date/location/shared links)
   - render related talks via reverse index

## Redirect Planning

For each talk and event page:

- collect legacy source URLs
- compare to canonical URLs
- emit `Redirect` records for non-canonical paths
- validate:
  - unique `from`
  - no chains
  - direct final target


## URL Verification Test Plan

Add data-driven URL contract tests so talks/event URL behavior is machine-validated during implementation.

### Contract Inputs

Use a contract fixture containing:

- canonical talks and events URLs
- legacy talk page URLs from old site shapes
- expected redirect target for each legacy URL
- expected HTTP status (`301`)

### Required Assertions

1. Canonical URL list has no duplicates and matches canonical path shape (`/path/`).
2. Every legacy talk page URL either:
   - remains canonical as-is, or
   - has exactly one 301 redirect to the canonical talk/event URL.
3. Redirect `from` paths are unique.
4. Redirect targets are canonical URLs.
5. No redirect chains are allowed.

### Initial Test Harness

- `tests/playwright/sitemap-urls.spec.js`: Playwright contract tests for sitemap-backed canonical URLs and legacy redirects.
- `tests/url_contracts/talks_url_contract.json`: fixture for legacy talk/event URLs and expected redirect targets/status.
- `playwright.config.js`: serves built `_site/` locally for URL tests.

Sitemap prerequisites:

- Generate `/_site/sitemap.xml` at build time using an Eleventy sitemap plugin (prefer `@quasibit/eleventy-plugin-sitemap` in `.eleventy.js`).
- Ensure talk and event pages are included in sitemap output before running tests.

This harness verifies URLs against actual built site output, not hand-maintained route lists.

## Future-Proof Linked Data Extensions

To support blog posts, talk instances, slide decks, and other related artifacts without adding root types prematurely:

### 1) Extend `Document` Through Nested Metadata

- Add optional nested extension areas under `meta.sourceMeta` first.
- Promote only stable, cross-source fields into canonical nested objects after observed repetition.

### 2) Add Optional Relationship References

Plan optional relationship arrays on `Document` in a backward-compatible way, for example:

- `relatedDocumentRefs[]` for blog posts derived from talks
- `assetRefs[]` for slide deck/video/repository resources

These should be introduced as additive fields with deterministic IDs and URL-safe references.

### 3) Consider Talk Occurrences as Event-Centric Instead of New Root Type

Before introducing `TalkInstance` as a new root type, model occurrences as:

- `eventRefs` + optional occurrence-level metadata
- canonical `Event` records for shared venue/date semantics

Only add a new root type if eventRef metadata becomes structurally overloaded.

## Implementation Phases

### Phase A — Data Foundations

- Add/verify talks loader coverage.
- Add normalization mapping for talk fields and `deliveredAt`.
- Add event candidate extraction tests.

### Phase B — Event Resolution

- Implement deterministic event dedupe.
- Assign stable event IDs/slugs.
- Build reverse relation index (`eventId -> talks`).

### Phase C — URL and Redirect Layer

- Assign canonical URLs for talks/events.
- Generate legacy redirect records.
- Add collision/chain validation checks.

### Phase D — 11ty Rendering

- Expose `_data/documents.js`, `_data/events.js`, `_data/redirects.js` slices needed for talks/events.
- Implement collections: `talks`, `events`.
- Implement talks/events index/detail pages.

### Phase E — Validation and Content QA

- Relationship integrity checks:
  - all `eventRefs.eventId` resolve
  - each event page has deterministic related-talk list
- URL and redirect checks.
- Snapshot or fixture tests for representative talks/events.

## Acceptance Criteria

1. Every talk source entry is represented as one canonical talk `Document`.
2. Every delivered occurrence is represented as or merged into canonical `Event` records.
3. Talk pages show linked events; event pages show linked talks.
4. Canonical URL and redirects are deterministic and chain-free.
5. Templates use canonical fields only (no source-specific keys).
6. Future linkage to blog posts/slides can be added additively without schema breakage.

## Suggested Initial Task Breakdown (Backlog-Ready)

1. Create talk source fixture set from `/sources/davidwesst.github.io`.
2. Implement/verify talk loader parsing and source metadata retention.
3. Implement talk normalization mapping to canonical `Document`.
4. Implement event candidate extraction from talk `deliveredAt`.
5. Implement event dedupe + stable id/slug generation.
6. Implement reverse relation index for event -> talks.
7. Implement talks/events canonical URL generation.
8. Implement redirect generation + redirect validator updates.
9. Implement talks index/detail templates bound to normalized data.
10. Implement events index/detail templates with related talks.
11. Add integration tests for one multi-event talk and one shared event.
12. Add QA checklist for URL parity with legacy paths.
