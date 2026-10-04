# PR #64 deployment verification investigation

Investigated on 2026-10-04. No application or deployment configuration was changed, and no release was redeployed during this investigation.

## Findings

PR #64 merged successfully as `8b44dabec457d24994350abc0396cfe57195e31e`. The failure was in the post-deployment verification job, not the Git merge or build.

[GitHub Actions run 37057252236](https://github.com/davidwesst/website/actions/runs/37057252236) records:

- The build, content checks, and Node tests passed.
- The downloaded `site` artifact contains the exact permanent redirect from `/answering-the-question-when-will-ie-support-that-html-feature` to `/blog/answering-the-question-when-will-ie-support-that-html-feature/`.
- Wrangler reported deployment completion at 2026-10-02 19:57:10.908 UTC, with version `3388d74c-6d99-49c0-afa0-7d4222f1f043`.
- Verification started at 19:57:11.043 UTC, approximately 135 milliseconds later, and failed at 19:57:12.012 UTC.
- Existing pages and the three older redirect checks passed before the first newly added alias returned 404.

On 2026-10-04, the same URL returned 301 with the correct destination and preserved query parameters on both `https://david.wes.st` and the production Worker's direct `workers.dev` address. The unchanged production verifier passed all 42 configured redirects and its other assertions. A separate live check of all 235 redirects from the failed run's downloaded artifact also passed: every rule returned its expected 301 status, retained the query parameter, stayed on the same origin, and reached a target returning 200 without another redirect.

## Cause and confidence

The confirmed verification defect was in `tools/check-hosting.mjs`: `waitForDeployment()` treated any HTTP 200 response from `/` as deployment readiness. The previous release already satisfied that condition. Its nominal 60-second wait therefore offered no protection against serving the previous release immediately after deployment. Subsequent redirect assertions had no propagation allowance.

The most likely incident trigger is a request reaching the previous deployment while the new release propagated. This explains why existing routes passed, the first new alias failed, and the same checks now pass without a repair. Cloudflare documents [eventually consistent global Worker code updates](https://developers.cloudflare.com/durable-objects/platform/known-issues/#code-updates).

The failed response did not record a release identifier, Cloudflare Ray ID, or cache diagnostics. Consequently, the logs cannot conclusively distinguish release propagation from another transient stale response or establish the exact serving version. Do not describe a particular cache TTL or edge location as proven.

## Implemented prevention

The fix preserves the canonical solution design: build and test once, deploy the verified artifact, and require real permanent redirects and genuine missing-page responses. There is no design conflict. The investigation above describes the original failure; the implementation adds the following controls.

1. Generate a release identity file inside the built artifact, containing the commit SHA and CI run/attempt identity. Verify that file as part of the build, upload it with the artifact, and use its exact expected value in deployment verification. Poll its value through the production hostname with a bounded deadline and revalidation; homepage availability alone is insufficient. Keep the release identity separate from presentation code.
2. After release identity matches, require the complete hosting assertion suite to pass within a bounded convergence window. Retry complete verification passes with logged failures; never accumulate individually successful assertions from different attempts. Require consecutive complete successful passes to reduce intermittent false success. A deadline expiry must remain a job failure. A marker alone cannot prove every later request reaches the same version.
3. Enable `--all-redirects` in deployment verification so every generated rule receives the same 301, destination, query-preservation, same-origin, and target-200 checks. Retain missing-route, asset, security-header, dispatcher, and telemetry checks.
4. Run the same full hosting suite against local Wrangler in CI before artifact upload. Exercise the downloaded artifact before live deployment as well, to cover artifact transfer. Local validation catches packaging and hosting-semantics regressions; it cannot replace verification through the public production domain.
5. Log expected/observed release identities, request URL, status, Location, CF-Ray, Age, and CF-Cache-Status on failures. Retain these diagnostics with the workflow so a later incident can distinguish propagation, stale caching, wrong deployment targets, and persistent route defects.

Regression coverage includes an old homepage returning 200, old identity followed by the expected identity, an identity that never updates, a matching identity with a permanently broken redirect, intermittent successes that must not be combined, network timeouts, and deadline exhaustion. Requests, clock, and delay are injected into the verification orchestration so retry tests are deterministic and fast. Real local Wrangler remains the HTTP integration test.

A fixed sleep alone cannot establish release readiness. Accepting 404/302 responses, dropping the failing route, ignoring the verification exit status, or retrying indefinitely would compromise the gate and should not be used.

The implemented defaults are a five-minute monotonic convergence deadline, two consecutive full successful passes separated by five seconds, a 20-second request/body budget capped by the remaining deadline, and at most six concurrent redirect requests. Ordinary CLI checks remain single-pass, with identity checks before and after the suite. Local Wrangler startup has a separate 60-second readiness budget and always cleans up the process tree. The artifact identity survives deployment-only job reruns. Live validation of the new mechanism requires merging and deploying the fix; passing pre-fix live checks is not evidence that the new mechanism has run in production.

The investigation evidence is retained locally under ignored `.cache/deployment-investigation/` and `.cache/failed-deployment-artifact/`. The pre-existing untracked `package-lock.json` was left untouched.

## Fix validation

On 2026-10-04, `pnpm test` passed all 77 tests in both branch and production telemetry modes, including the build and content integrity checks. `pnpm check:hosting:local` passed all 235 redirects and the remaining hosting assertions in both modes. The Windows runner left no workerd processes behind after each successful check. The initial checkout contained Git LFS pointers; fetching its real LFS assets resolved the initial asset hash failure without changing or bypassing integrity assertions.
