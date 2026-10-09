import { checkCrawlerAccess } from "../lib/crawler-checks.js";
const [value, ...flags] = process.argv.slice(2);
if (!value || flags.some((flag) => flag !== "--policy")) throw new Error("Usage: node tools/check-crawlers.mjs <site-origin> [--policy]");
const url = new URL(value);
if (!["http:", "https:"].includes(url.protocol) || url.pathname !== "/" || url.search || url.hash || url.username || url.password) throw new Error("Provide an HTTP(S) origin");
const result = await checkCrawlerAccess(url.origin, { verifyPolicy: flags.includes("--policy") });
console.log(`Crawler compatibility passed: ${result.agents} allowed search/retrieval/social UAs × ${result.pages} pages; policy checked: ${result.policyChecked}. UA probes do not establish real crawler identity or indexing.`);
