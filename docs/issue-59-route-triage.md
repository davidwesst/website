# Issue #59: route investigation and repairs

The implementation repairs 21 generated links and three malformed YouTube iframe sources, and adds 35 explicit permanent aliases for confirmed historic content, the authored MVP topic link, and three family-specific feeds. The 25 affected paths observed in the baseline account for 76 estimated 404 responses. Scanner-like paths and unresolved destinations continue to return genuine 404s.

## Capture provenance and limits

- Host: `david.wes.st`; zone: `335a79cb0a0dfe4ccb6ecebdbe6292d6`.
- Baseline UTC window: `2026-09-24T00:00:00Z` inclusive to `2026-10-02T00:00:00Z` exclusive. Captured at 2026-10-02 18:59:30 UTC.
- Complete inventory: 2,274 distinct paths, 14,350 estimated 404 responses, retrieved in ten lexically ordered pages of at most 250 rows. Grouped counts reconcile with a separate ungrouped provider total.
- Saved baseline SHA-256: `c43ada3ccf2e1cdcea1148b0a456a0b482f3606a43b240abe1922722232191f9`.
- The issue reports 14,346 estimated responses and 10,111 scanner-like responses. This fresh capture differs by four estimated responses; estimates can change between captures. This implementation uses its own explicit conservative probe patterns, including private configuration and editor probes, so its classification totals differ. Neither classification identifies human visitors.
- The original private report snapshot could not be located. Its referenced manifest hash has **not** been verified. This report uses the new saved capture, rather than claiming to reproduce that archive.
- Azure MCP was unavailable in this session. Authenticated Azure CLI queries of the existing Application Insights resource found 217 page views and zero dependency events in the baseline window. There is no browser dependency evidence supporting or refuting a route failure. The September 25–26 gap was intentional.
- A later capture covers only the 25 confirmed baseline paths from `2026-10-02T00:00:00Z` to `2026-10-02T19:36:05Z`, before this PR is deployed. It records two requests: one each to `/get-to-the-point-video-is-up/` and `/humble-bundle-games-go-javascript/`. Different window lengths and the absence of deployment prevent a recovery claim.
- Saved subsequent SHA-256: `16ee604f2a8960a11ba9eb68a8b900c96f2aaf3c3f0a5eacb56b1addfbcd05d9`.

The full route-level CSV, JSON, capture queries, and Azure aggregates remain in ignored `.cache/route-triage/`. They contain no visitor identifiers, request query strings, or referring query strings. This document includes only selected sanitized route decisions and aggregate counts; do not commit telemetry exports.

## Complete inventory classification

| Classification | Distinct paths | Estimated 404 responses |
| --- | ---: | ---: |
| scanner-like | 1176 | 10,583 |
| excluded-favicon-56 | 1 | 98 |
| unresolved | 1070 | 3,583 |
| confirmed-legacy-route | 22 | 73 |
| expected-404 | 1 | 8 |
| currently-published | 1 | 2 |
| confirmed-generated-embed | 3 | 3 |

The favicon is excluded because #56 owns that defect. The expected 404 is the deliberate hosting smoke-test path. The currently published path is the Application Insights bundle; its historical absence does not establish a current defect, and the intentional monitoring gap is not an outage.

## Confirmed decisions, ranked by baseline count

The later count is scoped to these paths. All have zero generated referring links in the repaired artifact. For embeds, the action corrects the authored URL; the malformed local URL continues to return 404. For content aliases, both slash forms receive direct 301 rules. The legacy blog feed remains article-only, matching its original implementation.

| Requested path | Baseline estimate | Later estimate | Confirmed intended destination | Supporting evidence |
| --- | ---: | ---: | --- | --- |
| `/talks/cots-to-cloud/` | 14 | 0 | `/talks/from-custom-cots-to-cloud/` | `/blog/defining-problem-before-the-solution/`, `/blog/highlight-reel-for-2022/` |
| `/tags/mvp/` | 10 | 0 | `/topics/mvp/` | `/blog/highlight-reel-for-2022/` |
| `/why-do-i-javascript/` | 7 | 0 | `/blog/why-do-i-javascript/` | `/blog/why-do-you-coffeescript-your-javascript/` |
| `/get-to-the-point-video-is-up/` | 5 | 1 | `/blog/get-to-the-point-my-pilot-video/` | `/blog/script-unscripted-starts-january-8th/` |
| `/html-gaming-for-core-gamers/` | 5 | 0 | `/blog/html-gaming-for-core-gamers/` | `/blog/html-gaming-for-core-gamers/` |
| `/can-asp-net-become-the-next-node-js/` | 4 | 0 | `/blog/can-asp-net-become-the-next-node-js/` | `/blog/think-before-you-tweet-a-lesson-in-humility/` |
| `/answering-the-question-when-will-ie-support-that-html-feature/` | 3 | 0 | `/blog/answering-the-question-when-will-ie-support-that-html-feature/` | `/blog/build-2014-cool-stuff-day-1/` |
| `/script-unscripted-starts-january-8th-2015/` | 3 | 0 | `/blog/script-unscripted-starts-january-8th/` | `/blog/retrospective-the-youtube-experiment/` |
| `/stop-hating-ie-and-be-a-professional-part-3` | 3 | 0 | `/blog/stop-hating-ie-and-be-a-professional-part-3/` | `/blog/stop-hating-ie-and-be-a-professional-part-1/`, `/blog/stop-hating-ie-and-be-a-professional-part-2/` |
| `/always-use-node/` | 2 | 0 | `/blog/always-use-node-even-on-non-node-projects/` | `/blog/what-is-bower/` |
| `/blog/feed.xml` | 2 | 0 | `/blog/articles/feed.xml` | Historical feed permalink at 9447db9^ |
| `/blog/gamelog/blue-prince` | 2 | 0 | `/blog/blue-prince/` | Authored links/redirectFrom and canonical content inventory |
| `/stop-hating-ie-and-be-a-professional-part-1` | 2 | 0 | `/blog/stop-hating-ie-and-be-a-professional-part-1/` | `/blog/stop-hating-ie-and-be-a-professional-part-2/`, `/blog/stop-hating-ie-and-be-a-professional-part-3/` |
| `/stop-hating-ie-and-be-a-professional-part-2` | 2 | 0 | `/blog/stop-hating-ie-and-be-a-professional-part-2/` | `/blog/stop-hating-ie-and-be-a-professional-part-1/`, `/blog/stop-hating-ie-and-be-a-professional-part-3/` |
| `/the-difference-between-apps-and-games/` | 2 | 0 | `/blog/the-difference-between-apps-and-games/` | `/blog/why-the-humble-mozilla-bundle-is-awesome/` |
| `//www.youtube.com/embed/-nbC9Pvykv8` | 1 | 0 | `https://www.youtube.com/embed/-nbC9Pvykv8` | `/blog/hypertext-gaming-starting-june-29th-on-twitch/` |
| `//www.youtube.com/embed/M5OQchl9bQA` | 1 | 0 | `https://www.youtube.com/embed/M5OQchl9bQA` | `/blog/get-to-the-point-my-pilot-video/` |
| `//www.youtube.com/embed/pAfPqxzyBIc` | 1 | 0 | `https://www.youtube.com/embed/pAfPqxzyBIc` | `/blog/javascript-coding-is-gameplay-in-screeps/` |
| `/blog/dungeonlog/feed.xml` | 1 | 0 | `/blog/dungeonlogs/feed.xml` | Historical feed permalink at 9447db9^ |
| `/blog/gamelog/feed.xml` | 1 | 0 | `/blog/gamelogs/feed.xml` | Historical feed permalink at 9447db9^ |
| `/gamelog/blue-prince` | 1 | 0 | `/blog/blue-prince/` | Authored links/redirectFrom and canonical content inventory |
| `/gamelog/sagres` | 1 | 0 | `/blog/sagres/` | Authored links/redirectFrom and canonical content inventory |
| `/humble-bundle-games-go-javascript` | 1 | 0 | `/blog/humble-bundle-games-go-javascript/` | Authored links/redirectFrom and canonical content inventory |
| `/humble-bundle-games-go-javascript/` | 1 | 1 | `/blog/humble-bundle-games-go-javascript/` | `/blog/why-the-humble-mozilla-bundle-is-awesome/` |
| `/remember-the-human` | 1 | 0 | `/projects/` | Authored links/redirectFrom and canonical content inventory |

For renamed articles, titles, publication context, and the referring article identify the destination: “Get to the Point: My Pilot Video”, “Script Unscripted Starts January 8th”, and “Always Use Node (Even on Non-Node Projects)”. Feed evidence comes from `9447db9^:src/blog/feed.11ty.js`, `src/blog/gamelog/feed.11ty.js`, and `src/blog/dungeonlog/feed.11ty.js`, before the archive move. Asset ownership was checked against the active migration manifest and colocated files; unrelated thumbnail names and stale asset paths do not establish a destination.

The four slashless requests for `/blog/gamelog/blue-prince`, `/gamelog/blue-prince`, `/gamelog/sagres`, and `/remember-the-human` already have slash aliases in authored `redirectFrom`. All four reproduced HTTP 404 locally before repair. Their exact missing aliases now return 301 to the existing Blue Prince, Sagres, and Projects destinations, preserving query strings.

## Selected unresolved cases

These remain explicit unresolved cases in the full table. A similar slug, a matching topic name, or an old-looking asset filename alone is insufficient evidence for a redirect. In particular, the 35 requests for the article's `bc` path have no matching current authored or rendered reference, and no confirmed target.

| Requested path | Baseline estimate | Classification | Evidence / decision |
| --- | ---: | --- | --- |
| `/blog/prairie-dev-con-2026-the-future-is-agentic/bc` | 35 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/rss` | 19 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/categories/blog/` | 13 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/gamelog/` | 11 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/tags/blog/` | 11 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/assets/featured-rotation.js.map` | 9 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/assets/GanjingAbout-Cb73sJYd.js` | 9 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/tags/blog` | 9 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/assets/favicon-aOK6_042.ico` | 7 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/feed/` | 7 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/assets/telemetry/simple-analytics.js/latest.js.map` | 6 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/blog/a-solo-gamejam-experience/` | 4 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/blog/keeping-your-edge-on-an-extended-break/` | 4 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/blog/defining-problem-before-the-soltuion` | 3 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |
| `/assets/telemetry/application-insights.js` | 2 | currently-published | Exists in the checked artifact; historical 404 does not establish a current defect |
| `/blog/prdc2026-panel.jpg` | 2 | unresolved | No generated reference or confirmed legacy mapping; preserve 404 |

## Reproduction

1. Build with the repository's Node 26 and pnpm 11 runtime. Use `GITHUB_REF_NAME=main` to include the production telemetry asset in the inventory.
2. Through the Cloudflare plugin, POST the query below to `/graphql`. Start `after` at the empty string; repeat with the final returned path until a page contains fewer than 250 rows. Save every query and response. Also query the same filter without dimensions to obtain the total count. Check that the path sum reconciles; split windows or re-query if sampling prevents reconciliation. Record estimation and any access/retention limitations.
3. Normalize the capture to the JSON contract below, set `complete` only after confirming coverage, and keep it under `.cache/route-triage/`. Preserve exact path casing and encoding. Remove query strings and visitor fields. For a scoped subsequent capture, include `paths` listing every queried path, including those with zero returned rows; paths outside that scope retain a null comparison count.
4. Run `pnpm routes:triage .cache/route-triage/cloudflare-baseline.json .cache/route-triage/cloudflare-subsequent.json`. It writes a ranked CSV and JSON with counts, classifications, evidence, targets, generated referrers, unresolved cases, and separate subsequent counts. Keep the checked artifact's commit and telemetry mode alongside the capture.
5. Run `pnpm test` in branch and production modes. Serve each verified artifact with `pnpm exec wrangler dev --local --port 8787` and run `node tools/check-hosting.mjs http://127.0.0.1:8787 --all-redirects` (`EXPECT_TELEMETRY=true` for production). Stop Wrangler before rebuilding on Windows.

```graphql
query Route404s($after: string!) {
  viewer {
    zones(filter: {zoneTag: "335a79cb0a0dfe4ccb6ecebdbe6292d6"}) {
      httpRequestsAdaptiveGroups(
        limit: 250
        orderBy: [clientRequestPath_ASC]
        filter: {
          datetime_geq: "2026-09-24T00:00:00Z"
          datetime_lt: "2026-10-02T00:00:00Z"
          clientRequestHTTPHost: "david.wes.st"
          edgeResponseStatus: 404
          clientRequestPath_gt: $after
        }
      ) { count dimensions { clientRequestPath } }
    }
  }
}
```

```json
{
  "hostname": "david.wes.st",
  "start": "2026-09-24T00:00:00Z",
  "end": "2026-10-02T00:00:00Z",
  "capturedAt": "2026-10-02T18:59:30Z",
  "estimated": true,
  "complete": true,
  "scope": "all 404 paths for the website host",
  "total404": 14350,
  "rows": [{"path": "/example/", "count": 1}]
}
```

The schema example's rows are illustrative; supply the full reconciled inventory, or omit `total404` for an explicitly scoped capture. The tool also accepts the saved paged GraphQL shape used for this investigation. Classification lives in `lib/route-triage.js`, compatibility data in `lib/legacy-route-repairs.js`, and content aliases in authored `redirectFrom`. Normal builds never read the archive.

Application Insights corroboration query (save only aggregated path results):

```kusto
dependencies
| where timestamp >= datetime(2026-09-24T00:00:00Z)
    and timestamp < datetime(2026-10-02T00:00:00Z)
| where resultCode == "404"
| extend parsed = parse_url(data)
| where tostring(parsed.Host) in ("david.wes.st", "davidwesst.com", "www.davidwesst.com")
| summarize requests = count() by path = tostring(parsed.Path)
| order by requests desc
```

## Completion evidence and remaining deployment gate

- Before: 21 broken generated anchors and three malformed iframe URLs. After: zero, verified by the expanded content-integrity check and output regressions.
- 35 new explicit aliases; the artifact contains 235 permanent redirect rules. Local hosting validation checks their status, same-origin destination, query preservation, and a real HTTP 200 target, together with genuine missing-route 404s and the unchanged gamelog query dispatcher.
- Required branch and production builds, content-integrity checks, and the Node suite pass. The image cache corruption regression reads metadata from a buffer to release Windows file handles before intentionally corrupting the file; its assertions remain intact.
- Optional `pnpm content:migrate:check` still stops on a pre-existing `pages/about/index.md` difference (expected “Hullo. My name…”; current page “Hullo.”). This PR leaves that page unchanged. Migration normalization retains the repaired aliases, canonical links, and embeds, covered by focused regressions.
- **After merge and production deployment:** save the deployment timestamp and commit, verify all repaired HTTP routes, and repeat the scoped Cloudflare capture for a comparable window. Re-run triage against that deployed artifact. Distinguish continued external requests to retained 404s from any remaining generated bad references. Only then mark the production follow-up acceptance criterion complete; this pre-deployment report does not close #59.
