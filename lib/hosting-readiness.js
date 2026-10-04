import { setTimeout as sleep } from "node:timers/promises";
import { HostingFailure } from "./hosting-request.js";

export async function waitForRelease({ checkIdentity, checkSite, expected, now = () => performance.now(), delay = sleep, log = console.warn, timeoutMs = 300000, intervalMs = 5000 }) {
  const start = now();
  const deadline = start + timeoutMs;
  let consecutive = 0;
  let lastFailure;
  let attempt = 0;
  while (now() < deadline) {
    attempt += 1;
    let observed = null;
    try {
      observed = await checkIdentity(deadline);
      await checkSite(deadline);
      await checkIdentity(deadline);
      if (now() >= deadline) throw new HostingFailure("Verification deadline exhausted");
      consecutive += 1;
      if (consecutive === 2) return;
    } catch (error) {
      if (!(error instanceof HostingFailure)) throw error;
      consecutive = 0;
      lastFailure = error;
      log(JSON.stringify({ attempt, elapsedMs: Math.round(now() - start), expected, observed, error: error.message, ...error.diagnostics }));
    }
    const remaining = deadline - now();
    if (remaining > 0) await delay(Math.min(intervalMs, remaining));
  }
  throw new HostingFailure(`Deployment verification did not converge within ${timeoutMs / 1000}s; last failure: ${lastFailure?.message || "insufficient consecutive successful passes"}`, { expected, ...lastFailure?.diagnostics }, { cause: lastFailure });
}
