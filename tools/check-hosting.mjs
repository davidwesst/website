import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CONFIRMED_REDIRECT_REPAIRS } from "../lib/legacy-route-repairs.js";
import { readDeployment } from "../lib/deployment-identity.js";
import { createRequest, HostingFailure } from "../lib/hosting-request.js";
import { checkIdentity, checkSite, parseRedirects } from "../lib/hosting-checks.js";
import { waitForRelease } from "../lib/hosting-readiness.js";

try {
  const [base, ...flags] = process.argv.slice(2);
  assert.ok(base, "Provide the deployed site URL");
  assert.ok(flags.every((flag) => ["--all-redirects", "--wait-for-release"].includes(flag)), "Unknown hosting check option");
  const url = new URL(base);
  assert.ok(["http:", "https:"].includes(url.protocol) && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash, "Provide an HTTP(S) site origin");
  const origin = url.origin;
  const expected = await readDeployment();
  const redirects = flags.includes("--all-redirects")
    ? parseRedirects(await readFile("_site/_redirects", "utf8"))
    : [["/blog.html", "/blog/"], ["/blog/gamelog/", "/blog/gamelogs/"], ["/blog/dungeonlog/", "/blog/dungeonlogs/"], ...CONFIRMED_REDIRECT_REPAIRS];
  const options = { origin, redirects, telemetryExpected: process.env.EXPECT_TELEMETRY === "true" };
  if (flags.includes("--wait-for-release")) {
    await waitForRelease({
      expected,
      checkIdentity: (deadline) => checkIdentity(createRequest(origin, { deadline }), expected),
      checkSite: (deadline) => checkSite(createRequest(origin, { deadline }), options),
    });
  } else {
    const request = createRequest(origin);
    await checkIdentity(request, expected);
    await checkSite(request, options);
    await checkIdentity(request, expected);
  }
  console.log(`Hosting checks passed: ${origin}; release ${expected.buildId}; ${redirects.length} permanent redirects retain queries and reach published targets.`);
} catch (error) {
  console.error(error instanceof HostingFailure ? JSON.stringify({ error: error.message, ...error.diagnostics }) : error);
  process.exitCode = 1;
}
