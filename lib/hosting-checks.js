import assert from "node:assert/strict";
import { validateDeployment } from "./deployment-identity.js";
import { requireHosting, HostingFailure } from "./hosting-request.js";

export function parseRedirects(text) {
  const rows = text.trim().split(/\r?\n/).map((line) => line.trim().split(/\s+/));
  const sources = new Set();
  for (const [source, target, status, extra] of rows) {
    assert.ok(source?.startsWith("/") && !source.startsWith("//") && !/[?#]/.test(source), "Invalid artifact redirect source");
    assert.ok(target?.startsWith("/") && !target.startsWith("//") && !/[?#]/.test(target), "Invalid artifact redirect target");
    assert.ok(status === "301" && !extra, "Artifact redirects must be permanent");
    assert.ok(!sources.has(source), "Duplicate artifact redirect source");
    sources.add(source);
  }
  return rows.map(([source, target]) => [source, target]);
}

export async function checkIdentity(request, expected) {
  const response = await request("/deployment.json", { body: true });
  requireHosting(response.status === 200, "Deployment identity must return 200", response);
  let observed;
  try {
    observed = validateDeployment(JSON.parse(response.bytes.toString("utf8")));
  } catch (error) {
    if (!(error instanceof SyntaxError) && error.code !== "ERR_ASSERTION") throw error;
    throw new HostingFailure("Invalid deployed identity", { ...response.diagnostics, observed: response.bytes.toString("utf8").slice(0, 500) });
  }
  requireHosting(JSON.stringify(observed) === JSON.stringify(expected), "Deployed identity does not match artifact", response, { observed });
  requireHosting(response.headers.get("cache-control")?.split(/,\s*/).includes("no-store"), "Deployment identity must not be cached", response, { observed });
  return observed;
}

// Drain in-flight checks before returning a failure, so retries never overlap passes.
async function concurrentChecks(items, check) {
  let next = 0;
  let failure;
  await Promise.all(Array.from({ length: Math.min(6, items.length) }, async () => {
    while (!failure && next < items.length) {
      const item = items[next++];
      try { await check(item); } catch (error) {
        if (!failure || !(error instanceof HostingFailure)) failure = error;
      }
    }
  }));
  if (failure) throw failure;
}

export async function checkRedirects(request, origin, redirects) {
  await concurrentChecks(redirects, async ([source, target]) => {
    const response = await request(`${source}?migration=check`);
    requireHosting(response.status === 301, `${source} must be permanent`, response);
    const rawLocation = response.headers.get("location");
    requireHosting(Boolean(rawLocation?.trim()), `${source} must provide Location`, response);
    let location;
    try { location = new URL(rawLocation, origin); } catch {
      throw new HostingFailure(`${source} has malformed Location`, response.diagnostics);
    }
    requireHosting(location.pathname === target, `${source} destination must be ${target}`, response);
    requireHosting(location.searchParams.get("migration") === "check", `${source} must retain query parameters`, response);
    requireHosting(location.origin === origin, `${source} must redirect within the site`, response);
    requireHosting(!location.hash, `${source} must not add a fragment`, response);
  });
  await concurrentChecks([...new Set(redirects.map(([, target]) => target))], async (target) => {
    const response = await request(target);
    requireHosting(response.status === 200, `${target} destination must be published`, response);
  });
}

export async function checkSite(request, { origin, redirects, telemetryExpected }) {
  let home;
  for (const route of ["/", "/blog/", "/talks/", "/about/", "/feed.xml", "/sitemap.xml", "/assets/main.css", "/favicon.ico"]) {
    const response = await request(route, { body: route === "/" || route === "/favicon.ico" });
    requireHosting(response.status === 200, `${route} should return 200`, response);
    requireHosting(response.headers.get("x-content-type-options") === "nosniff", `${route} security header`, response);
    if (route === "/") home = response;
    if (route === "/favicon.ico") {
      requireHosting(/^image\/(?:x-icon|vnd\.microsoft\.icon)(?:;|$)/i.test(response.headers.get("content-type") || ""), "Favicon Content-Type", response);
      requireHosting(response.bytes.length >= 6, "Favicon must have an ICO header", response);
      requireHosting(response.bytes.readUInt32LE(0) === 0x00010000, "Favicon must be an ICO image", response);
      requireHosting(response.bytes.readUInt16LE(4) > 0, "Favicon must contain an image", response);
    }
  }
  await checkRedirects(request, origin, redirects);
  const legacy = await request("/blog/gamelog/entry.html?slug=clair-obscur-expedition-33", { body: true, redirect: "follow" });
  requireHosting(legacy.status === 200, "Legacy dispatcher should return 200", legacy);
  requireHosting(new URL(legacy.url).searchParams.get("slug") === "clair-obscur-expedition-33", "Legacy dispatcher must retain slug", legacy);
  requireHosting(/URLSearchParams/.test(legacy.bytes.toString("utf8")), "Legacy dispatcher must parse query parameters", legacy);
  for (const route of ["/migration-missing-page-93a10/", "/wp/", "/.env", "/rss", "/blog/prairie-dev-con-2026-the-future-is-agentic/bc", "//www.youtube.com/embed/M5OQchl9bQA", "/talks/no-such-talk/", "/tags/no-such-topic/", "/assets/no-such-image.png"]) {
    const response = await request(route);
    requireHosting(response.status === 404, `${route} must remain missing`, response);
  }
  const html = home.bytes.toString("utf8");
  requireHosting(!/static\.cloudflareinsights\.com|sentry/i.test(html), "Unexpected browser diagnostics", home);
  const hasTelemetry = /\/assets\/telemetry\/application-insights\.js/.test(html);
  requireHosting(hasTelemetry === telemetryExpected, "Homepage telemetry must match build mode", home);
  if (telemetryExpected) {
    const response = await request("/assets/telemetry/application-insights.js");
    requireHosting(response.status === 200, "Telemetry asset must be published", response);
  }
}
