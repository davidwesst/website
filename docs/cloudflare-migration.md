# Cloudflare migration runbook

## Target and current state

Cloudflare Workers Static Assets hosts the Eleventy output. Cloudflare DNS becomes authoritative for `wes.st`. GitHub Actions remains the sole deployment pipeline. Simple Analytics provides engagement analytics and Application Insights provides privacy-first browser operational diagnostics.

- Branch: `ft/cloudflare-migration`.
- Production Worker: `davidwesst-website`.
- Staging Worker: `davidwesst-website-staging`.
- Account: `97e526198c138c4e71e6210d40547648`.
- Zone: `335a79cb0a0dfe4ccb6ecebdbe6292d6`.
- Assigned nameservers: `cruz.ns.cloudflare.com`, `matias.ns.cloudflare.com`.
- Six application DNS records copied from Azure, with original 3600-second TTLs and proxying disabled: MX, SPF TXT, federation SRV, autodiscover CNAME, Bitly `d` CNAME, website `david` CNAME.
- `david.wes.st` is attached directly to the production `davidwesst-website` Worker. Cloudflare manages its proxied DNS record and certificate; the former Azure CNAME has been removed.
- Registrar: nic.st. The owner changed delegation to the assigned Cloudflare nameservers on 2026-09-24.
- nic.st does not expose DS-record management. Cloudflare DNSSEC was disabled on 2026-09-24 after it remained pending without a parent DS record. The zone is intentionally unsigned; revisit DNSSEC if the registrar adds DS support or the domain moves to a registrar that supports it.
- Cloudflare Web Analytics/RUM is disabled and automatic beacon injection is off. Simple Analytics and the self-hosted Application Insights browser bundle are the only production telemetry scripts.

Local private rollback inventory is in ignored `.cache/migration/`: Azure DNS JSON and zone export, resource inventory, and pre-migration source ZIP. The previous GitHub deployment artifact has expired; the deployed Azure site remains the immediate rollback target. Retain newly generated artifacts for 14 days. Do not commit telemetry exports or credentials.

## Deployment controls

GitHub secret `CLOUDFLARE_API_TOKEN` must grant Account > Workers Scripts > Edit for DW Account, including newly created Workers. The asset-upload endpoint requires this permission. A user API token is the fallback if an account-owned token is rejected despite equivalent scope. Repository variable `CLOUDFLARE_ACCOUNT_ID` identifies the same account. The owner's same-named secret may remain, but the workflow uses the variable.

- `CLOUDFLARE_DEPLOY_ENABLED=true` enables Cloudflare deployments after successful builds.
- Pushes to `ft/cloudflare-migration` deploy analytics-free staging; pushes to `main` deploy production.
- `CLOUDFLARE_STAGING_URL=https://davidwesst-website-staging.dw-97e.workers.dev`.
- `CLOUDFLARE_PRODUCTION_URL=https://david.wes.st`.
- `HOSTING_PROVIDER=cloudflare` prevents future main-branch deployments to Azure.
- Custom-domain attachment is an explicit cutover operation through the Cloudflare MCP, not a side effect of branch deployment.

The checked artifact is deployed without rebuilding. Ordinary PR events cannot deploy or access deployment credentials. No Cloudflare Git build integration is needed.

The CI build, Cloudflare staging deployment, and live smoke checks passed on 2026-09-24. Main-branch run 36039791515 deployed the production Worker successfully. The custom-domain cutover and the full production smoke suite also passed on 2026-09-24 after disabling Cloudflare's automatically created Web Analytics site and confirming its beacon was absent.

## Ordered checklist

1. [x] Inventory Azure, preserve rollback configuration, create the migration branch.
2. [x] Create Cloudflare zone and copy/verify the six application DNS records through MCP.
3. [x] Implement shared route adapters, security headers, Cloudflare configuration, and removal of Application Insights.
4. [x] Run branch and production builds/tests; validate hosting behavior with local Wrangler.
5. [x] Confirm GitHub staging deployment and live smoke checks succeed. The migration PR is ready for normal review.
6. [x] **Human:** review and merge the migration PR.
7. [x] **Human:** change nameservers at nic.st to the assigned Cloudflare pair while keeping website DNS pointed at Azure.
8. [x] Verify Cloudflare zone activation, delegated DNS records, and website availability. DNSSEC is intentionally disabled because nic.st does not expose DS-record management. Preserve Azure DNS throughout propagation.
9. [x] **Human:** confirm Microsoft 365 mail send/receive and representative Bitly-managed `d.wes.st` links after delegation.
10. [x] Verify the main-branch production Worker. Attach `david.wes.st` through MCP, replacing the existing CNAME conflict. Verify certificate issuance and HTTPS. Set `HOSTING_PROVIDER=cloudflare` and update the production smoke-check URL.
11. [ ] Observe seven consecutive healthy days beginning 2026-09-24 and at least one later successful production deployment. The earliest cleanup date is 2026-10-01. Check website, redirects, DNS, mail, Simple Analytics, and Application Insights browser errors and performance. A material regression resets the observation period.
12. [ ] Prepare final deletion: remove the Azure workflow job, rollback route adapter, obsolete GitHub secrets, and provider-specific tests in a follow-up PR; verify that deployment. Recheck all resource dependencies and obtain owner confirmation for the exact deletion list. Retain Application Insights, its alerting dependencies, and its Log Analytics workspace.
13. [ ] **Final step:** delete only the two retired hosting resources below and verify their removal plus website/DNS/analytics health. Retain the subscription, resource group, and monitoring resources.

## Validation and rollback

Run `pnpm test` for the current branch. To exercise production telemetry, set `GITHUB_REF_NAME=main` for that invocation; no Azure credential or build-time environment variable is required. Stop `wrangler dev` before rebuilding on Windows because its asset watcher can lock `_site`.

After a production-mode build, run `pnpm exec wrangler dev` and set `EXPECT_TELEMETRY=true` when running `node tools/check-hosting.mjs http://127.0.0.1:8787`. All 197 generated permanent redirects and their query preservation have also been verified against local Wrangler. The same smoke script runs against deployments with the expected telemetry mode supplied by the workflow. It verifies key pages/assets, headers, permanent legacy redirects and query preservation, gamelog dispatcher query handling, 404s, the production Application Insights asset, and the absence of Cloudflare and Sentry browser diagnostics.

Rollback triggers: TLS failure, sustained availability failure, material missing content, or broken legacy routing. For a Cloudflare release regression, use `pnpm exec wrangler rollback <verified-previous-version>` with account credentials. For hosting rollback, detach the Worker custom-domain binding, restore the DNS-only CNAME `david.wes.st -> gray-smoke-09b0c160f.7.azurestaticapps.net`, and verify Azure responds through the custom hostname. Keep Cloudflare authoritative; do not reverse nameservers for a hosting-only failure. Set `HOSTING_PROVIDER=azure` to restore future Azure deployments. Preserve the original Azure custom-domain binding throughout the observation period.

## Final Azure deletion list

Resource group: `davidwesst.com`, subscription `DW` (`bc1e6e62-483e-4015-9041-efa07de2b994`). Delete explicitly by resource ID, not by resource group.

1. `swa-davidwesstcom-prod` — Static Web App.
2. `wes.st` — Azure DNS zone, only after confirming Cloudflare delegation, intentional unsigned DNSSEC state, and full record parity.

Retain `appi-davidwesstcom-prod`, `log-davidwesstcom-prod`, `Failure Anomalies - appi-davidwesstcom-prod`, and `Application Insights Smart Detection` because the Cloudflare-hosted browser now sends operational telemetry to that monitoring stack.

This is a manual gated cleanup, not an automatic deletion script. No Azure deletion occurs in the initial PR.
