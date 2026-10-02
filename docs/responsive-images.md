# Responsive authored images — issue #57

All 19 routes flagged by the saved technical-health 1.0.2 report have working responsive WebP sources. Preparation also covers six other static authored images at least 1,000,000 bytes in the current inventory. Originals remain byte-for-byte intact and retain their published URLs, migration hashes, alt text, credits, and social preview behavior.

## Measurement conditions

The baseline artifact was built from commit `32a49f93dafea6e4f3318bcbd0032259fadf3bf7` before responsive image processing. Before and after used Chromium 151.0.7922.34, Node v26.9.0, local Wrangler HTTP, no network or CPU throttling, a fresh browser context per page, and reduced motion. Mobile is 390 × 844 CSS pixels at DPR 2; desktop is 1440 × 900 at DPR 1. One navigation per page/viewport measured resource bytes, not timing performance. Each audit captured 110 image uses across detail pages, inline prose, the home page, Blog, Talks, and Dungeonlogs. Below-the-fold cards were scrolled into view to load lazy images.

Bytes are exact image response body lengths from the browser-selected resources (excluding headers). The original source file lengths matched the baseline responses. Cloudflare estimated mean response sizes were only the route selection signal and are not interchangeable with these lab measurements. These results do not measure LCP, INP, CLS, uptime, or a production visitor cohort.

## Original inventory and rendered dimensions

The dimensions below describe each image on its owning detail page. Post banners retain their existing 16:9 crop; talks and inline images keep their natural aspect ratio.

| Original route | Original bytes | Intrinsic pixels | Mobile CSS pixels | Desktop CSS pixels |
| --- | ---: | --- | --- | --- |
| /blog/2025-08-04/SessionRecap_2025-08-04-Alt.png | 3,079,740 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/2025-08-18/SessionRecap-Poster_2025-08-18.png | 3,339,796 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/2025-09-01/SessionRecap_Poster_2025-09-01.png | 3,143,188 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/2025-10-18/2025-10-18_Poster.png | 3,136,967 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/2025-11-17/2025-11-17_Poster.png | 2,910,409 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/2025-12-01/2025-12-01_Poster.png | 2,481,170 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/2025-12-15/2025-12-15_Poster.png | 2,456,751 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/2025-12-27/2025-12-27_Poster.png | 2,664,003 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/2026-01-05/2026-01-05_Poster.png | 2,857,874 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/2026-01-25/2026-01-25_Poster.png | 3,643,308 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/2026-02-08/2026-02-08_Poster.png | 3,755,269 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/2026-03-16/2026-03-16_Poster.png | 3,164,888 | 1024 × 1536 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/docker-build-hangs-on-apt-key-in-wsl2/docker-build-hangs-on-apt-key-in-wsl2_thumbnail.png | 1,142,869 | 1200 × 630 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/does-gdpr-apply-to-personal-websites/gdpr-cookie_thumbnail.png | 1,075,706 | 1200 × 630 | 358.00 × 201.38 | 976.00 × 549.00 |
| /blog/fulfillment-through-cake-and-ice-cream/ice-cream-butt.jpg | 2,498,478 | 4032 × 2268 | 302.00 × 169.88 | 784.00 × 441.00 |
| /blog/remote-ie-no-more-testing-excuses/wp_20141103_002-1-.jpg | 2,503,208 | 3552 × 2000 | 302.00 × 169.88 | 784.00 × 441.77 |
| /talks/a-guide-to-saas-ready-banner-customizations-in-2026/a-guide-to-saas-ready-banner-customizations-in-2026.png | 1,301,037 | 1672 × 941 | 358.00 × 201.38 | 976.00 × 549.00 |
| /talks/empowering-campus-innovation-through-ethos-data-connect/empowering-campus-innovation-through-ethos-data-connect.png | 1,247,428 | 1672 × 941 | 358.00 × 201.38 | 976.00 × 549.00 |
| /talks/three-perspectives-on-ai/three-perspectives-on-ai_banner.png | 1,372,333 | 1672 × 941 | 358.00 × 201.38 | 976.00 × 549.00 |

## Same-viewport transfer comparison

Before bytes are the original bytes in the table above at both viewports. The after columns report the actual WebP candidate chosen by Chromium; no viewport or DPR changed between runs. Exact candidate URLs, encoded dimensions, content types, alt text, and before/after geometry are saved in `docs/image-audit.json`.

| Original route | Mobile after bytes | Mobile reduction | Desktop after bytes | Desktop reduction |
| --- | ---: | ---: | ---: | ---: |
| /blog/2025-08-04/SessionRecap_2025-08-04-Alt.png | 202,728 | 93.42% | 423,406 | 86.25% |
| /blog/2025-08-18/SessionRecap-Poster_2025-08-18.png | 225,924 | 93.24% | 472,436 | 85.85% |
| /blog/2025-09-01/SessionRecap_Poster_2025-09-01.png | 220,694 | 92.98% | 451,788 | 85.63% |
| /blog/2025-10-18/2025-10-18_Poster.png | 234,668 | 92.52% | 468,780 | 85.06% |
| /blog/2025-11-17/2025-11-17_Poster.png | 239,396 | 91.77% | 421,704 | 85.51% |
| /blog/2025-12-01/2025-12-01_Poster.png | 190,232 | 92.33% | 280,794 | 88.68% |
| /blog/2025-12-15/2025-12-15_Poster.png | 197,736 | 91.95% | 290,680 | 88.17% |
| /blog/2025-12-27/2025-12-27_Poster.png | 204,978 | 92.31% | 330,078 | 87.61% |
| /blog/2026-01-05/2026-01-05_Poster.png | 227,298 | 92.05% | 374,588 | 86.89% |
| /blog/2026-01-25/2026-01-25_Poster.png | 328,800 | 90.98% | 552,536 | 84.83% |
| /blog/2026-02-08/2026-02-08_Poster.png | 318,536 | 91.52% | 559,050 | 85.11% |
| /blog/2026-03-16/2026-03-16_Poster.png | 259,798 | 91.79% | 417,716 | 86.8% |
| /blog/docker-build-hangs-on-apt-key-in-wsl2/docker-build-hangs-on-apt-key-in-wsl2_thumbnail.png | 90,560 | 92.08% | 143,510 | 87.44% |
| /blog/does-gdpr-apply-to-personal-websites/gdpr-cookie_thumbnail.png | 89,836 | 91.65% | 143,940 | 86.62% |
| /blog/fulfillment-through-cake-and-ice-cream/ice-cream-butt.jpg | 20,966 | 99.16% | 31,024 | 98.76% |
| /blog/remote-ie-no-more-testing-excuses/wp_20141103_002-1-.jpg | 44,102 | 98.24% | 71,688 | 97.14% |
| /talks/a-guide-to-saas-ready-banner-customizations-in-2026/a-guide-to-saas-ready-banner-customizations-in-2026.png | 20,086 | 98.46% | 31,112 | 97.61% |
| /talks/empowering-campus-innovation-through-ethos-data-connect/empowering-campus-innovation-through-ethos-data-connect.png | 25,578 | 97.95% | 36,044 | 97.11% |
| /talks/three-perspectives-on-ai/three-perspectives-on-ai_banner.png | 35,150 | 97.44% | 50,682 | 96.31% |

One owning-page image per selected route totals 47,774,422 original bytes, 3,177,066 mobile after bytes, and 5,551,556 desktop after bytes. Every owning-page variant reduces bytes by at least 84.83%. This is an equal-weight sum of the selected routes, not a traffic-weighted estimate.

## Rendering and preservation checks

All 110 measured image uses decoded successfully with HTTP 200 and selected WebP output. Alt text matched the baseline in the paired uses. Intrinsic width/height attributes reserve space before loading. Maximum owning-page geometry difference was 0.328 CSS pixels from integer resize rounding; cropped poster frames were unchanged. Original-format fallbacks remain in each picture's img element, and social metadata still refers to the original images.

Visual comparison covers mobile and desktop home, Blog, Talks, the February 8 dungeonlog, Three Perspectives on AI, and the inline photograph in Remote IE. The representative images retain their framing, colors, text legibility, and page layout. Screenshots are generated beside each audit JSON for repeatable review; they are local QA artifacts rather than authored content.

`pnpm test` checks original output hashes, valid smaller derivatives, bounded widths, cache reuse and repair, picture sources, intrinsic dimensions, retained links/alt text, and original preview images. Content integrity additionally validates every advertised responsive URL, migration-manifest hashes, asset ownership, and legacy routes.

## Repeat the audit

Install the locked dependencies, then install the matching browser once:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test
pnpm exec wrangler dev --local
```

With the finished artifact being served, run in a separate terminal:

```sh
pnpm images:audit http://localhost:8787 .cache/image-audit/after.json
```

For a new before/after comparison, build and serve the baseline commit in a separate checkout and run the same tool against its URL, writing a separate JSON. Keep Chromium, viewport, DPR, CSS, and content inventory constant. Complete the build before starting an audit. The audit fails when a page is unavailable, an image cannot decode, or a selected route has no rendered image.

## Preparation and follow-up

`pnpm prepare:images` discovers active static PNG/JPEG/WebP assets at least 1 MB and generates quality-90 WebP candidates at 384, 768, 1024, 1536, and 2048 pixels, bounded by original width. Animated images and smaller files remain unchanged. Original resolution is included when below the cap; images are never enlarged. Only candidates smaller than the original are advertised. Source bytes, encoder settings, and library versions determine separate derivative URLs. Cached derivatives are verified by SHA-256 before reuse. Only currently advertised derivatives are copied to the artifact.

Build and dev startup prepare the cache before Eleventy. Restart dev or rerun preparation/build after changing an authored image. The size hints describe the existing detail, prose, featured, and card layouts; update them when those layouts change. Lazy cards use native auto sizing with conservative fallback hints; hero/detail images remain eager.

After deployment, verify the original and selected derivative URLs and collect a comparable later technical-health snapshot. Compare affected route bytes and status counts alongside request counts, time windows, cache/304 behavior, and browser/bot populations. Direct requests and social crawlers may still intentionally fetch originals. A reduction in aggregate bytes alone is not evidence of a visitor performance improvement. That follow-up has not run in this PR.
