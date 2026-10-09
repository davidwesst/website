# Public crawler policy

Owner decision: allow traditional search, AI search/retrieval, and user-directed agents; deny the named training crawlers. lib/crawler-policy.js is the reviewed registry generating robots.txt. The default remains public crawling, including required images/styles, feeds, social preview fetchers, and standards-based engines such as Brave. This is a robots policy, not access control against unidentified or non-compliant crawlers.

| Purpose | Agents | Policy |
| --- | --- | --- |
| Traditional search | Googlebot, bingbot, DuckDuckBot, other search crawlers | Allow |
| AI retrieval | OAI-SearchBot, Claude-SearchBot, PerplexityBot | Allow |
| User-directed access | ChatGPT-User, Claude-User, Perplexity-User | Allow |
| Named training crawlers | GPTBot, ClaudeBot | Disallow |
| Combined Gemini training and grounding | Google-Extended | Disallow |

Google-Extended is a product token, not a separate HTTP fetcher. Denying it also limits certain Gemini grounding uses; ordinary Googlebot and Google Search remain allowed. User-directed fetchers may ignore robots directives, so CDN access must also support the chosen allow policy. New or mixed-purpose crawlers need a deliberate review against current operator documentation rather than automatic addition to a broad blocklist.

## Cloudflare alignment and monitoring

Read-only baseline checked on 2026-10-08: wes.st uses the Free Website plan. Bot Fight Mode, blanket AI-bot protection, crawler labyrinth, and managed robots/preference sync are disabled. No custom WAF ruleset was present. Existing managed normalization, free security, and DDoS rules remain active. Production robots.txt and About returned 200. All 36 combinations of the nine allowed search/AI agents and four representative pages returned 200. The strict new-metadata probe correctly rejected the existing homepage for missing JSON-LD; #71 repairs that upon deployment. No dashboard changes were needed to permit desired retrieval; the repository robots file will introduce the training directives when #72 deploys.

Keep managed robots/preference sync off while this repository owns the policy. If enabled later, inspect the complete effective robots response: Cloudflare can prepend rules that conflict with the registry. Avoid blanket Block AI Bots and challenges affecting desired crawlers. AI Crawl Control can inspect individual crawler activity and optionally enforce named training blocks. On the free plan detection relies on self-identifying user agents; it is not proof of identity. Do not bypass WAF solely on a user-agent string. Any exemption should verify the operator's current published IPs or Cloudflare's verified-bot classification. No paid feature or browser telemetry is required.

After deployment, run `pnpm check:crawlers https://david.wes.st --policy`. CI also runs this against local static hosting. The check fetches Home, About, a devlog, and a gamelog using allowed search, AI retrieval, user, and social user-agent strings; checks initial HTML, canonical URLs, authorship/dates, preview images, feeds/assets, and effective policy. A UA probe tests accessibility from the runner, not real crawler IP ranges, indexing, or citations.

For blocked requests, record UTC time, route, status, user agent, and CF-Ray identifier. Inspect Security Events and AI Crawl Control for the matching action/rule. Distinguish robots exclusion, 403/429, JS challenges, missing assets, stale deployment, and true 404s. Review named training violations separately from permitted retrieval. Preserve privacy: report aggregate crawler activity; do not add visitor identifiers or custom analytics events.

Owner post-deployment validation: use available ChatGPT, Claude, and Perplexity search/retrieval features on representative URLs. Confirm David's authorship, correct titles, accurate summaries, and canonical citations. Review Google/Bing indexing and Cloudflare allowed/blocked crawler activity after recrawling. Record observed results here; no search appearance is guaranteed. See docs/search-discovery.md for console setup and traffic review.

References: [OpenAI bots](https://developers.openai.com/api/docs/bots), [Anthropic bots](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), [Perplexity bots](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), [Google crawler controls](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers), [Cloudflare controls](https://developers.cloudflare.com/ai-crawl-control/features/manage-ai-crawlers/).
