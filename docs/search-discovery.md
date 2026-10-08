# Search and devlog discovery

Google, Bing, and DuckDuckGo are the primary targets. DuckDuckGo largely sources traditional results from Bing. Brave is a secondary standards-based compatibility target. The canonical site is https://david.wes.st; David Wesst is the author, and Cocoboko Studios is his studio. Devlogs are articles discovered through /topics/devlog/, not a new content type.

## Owner setup and validation

- Verify a Google Search Console property and Bing Webmaster Tools site for david.wes.st with DNS TXT verification. Record the exact records here once provided; no verification values have been invented. Preserve existing verification records during DNS changes.
- Submit https://david.wes.st/sitemap.xml in both consoles. Check Home, About, Projects, a devlog, a gamelog, and a talk for indexing, chosen canonical, title, and description.
- Validate representative JSON-LD with Schema.org Validator and Google's Rich Results Test. Profile and breadcrumb markup describes visible content; enhanced search appearance is not guaranteed.
- Confirm old hostnames and legacy paths redirect to canonical pages, missing pages return 404, and workers.dev hosts send X-Robots-Tag: noindex.
- Record the pre-release search impressions, clicks, CTR, organic landing pages, and devlog/Projects page views. Review after 28 and 56 days. Simple Analytics retains its existing aggregate-only policy: no outbound-click custom events.
- Validate shared links in LinkedIn's Post Inspector and available Discord, Reddit, and Mastodon preview tools. Owner-run test posts should check title, image, description, and canonical URL. No automated posting is installed.

## IndexNow

The public ownership key is repository configuration in src/_data/indexnow.js. Eleventy publishes /{key}.txt. The build fingerprints every sitemap page and its local presentation/discovery assets in indexnow-manifest.json; that operational file is excluded from sitemap and feeds.

On main push builds, CI restores the most recent main-branch indexnow-state artifact before deployment. If the feature has never deployed, it captures the existing production sitemap to preserve removals during bootstrap. Once a production manifest exists, missing state fails the notification preparation instead of silently discarding old URLs. Notification failures do not invalidate or roll back a healthy site deployment.

After successful Azure or Cloudflare production deployment, a separate job checks the live release, manifest, and ownership key. It submits added, changed, removed, and previously pending URLs to https://api.indexnow.org/indexnow in batches of at most 10,000. HTTP 200/202 count as acceptance; 202 still awaits protocol key validation. Transient failures retry three times. The acknowledged baseline advances only when every batch is accepted. Partial failures retain the full pending batch for safe, idempotent retry on the next production deployment.

State is uploaded even on submission failure and retained for 90 days (or the repository's lower configured maximum). Download a copy before a long publishing hiatus. To recover missing/expired state, restore the newest saved state.json into a main-run indexnow-state artifact. If none exists, explicitly build a schemaVersion: 1 object containing baseline URL-to-hash entries (null hashes are permitted) and a pending list; include the historical URL inventory and any known removed URLs. Never seed only the current sitemap and assume deletions are recovered. Rerun a verified production workflow after restoring state.

To rotate the key, change the repository value, deploy the matching new file, retain the state artifact, and verify the new key before submitting. The key proves ownership by public HTTP access and is not a private credential. No submission happens in local tests, PRs, staging, or failed deployment jobs. The deployment identity and live manifest guard against stale or overlapping releases.

References: [IndexNow protocol](https://www.indexnow.org/documentation), [DuckDuckGo sources](https://duckduckgo.com/duckduckgo-help-pages/results/sources), [Brave crawler](https://search.brave.com/help/brave-search-crawler).
